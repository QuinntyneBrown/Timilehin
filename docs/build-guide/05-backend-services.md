# 05 — Backend Services

In this chapter, you will write the **business logic** — the code that fetches Bible verses from the external API and manages devotional data. Services are the "brains" of the backend.

---

## Why Services?

Controllers (which we build next chapter) handle HTTP requests, but they should not contain business logic. Instead, they delegate to **services**. This separation makes the code:

- **Testable** — you can test the logic without making real HTTP requests
- **Reusable** — multiple controllers can use the same service
- **Clean** — each piece has one job

---

## Step 1: Define the Service Interfaces

An **interface** defines *what* a service can do without specifying *how*. This lets you swap implementations later (e.g., for testing).

Create `src/Timilehin.Api/Services/IBibleService.cs`:

```csharp
using Timilehin.Api.DTOs;

namespace Timilehin.Api.Services;

public interface IBibleService
{
    Task<VerseOfTheDayDto> GetVerseOfTheDayAsync();
    Task<BibleChapterDto?> GetChapterAsync(string book, int chapter);
}
```

**Reading this aloud:** "A Bible service must be able to get the verse of the day, and get a chapter by book name and chapter number."

The `?` after `BibleChapterDto?` means this method can return "nothing" (null) if the book/chapter is not found.

Create `src/Timilehin.Api/Services/IDevotionalService.cs`:

```csharp
using Timilehin.Api.DTOs;

namespace Timilehin.Api.Services;

public interface IDevotionalService
{
    Task<PaginatedResult<DevotionalSummaryDto>> GetAllAsync(int page, int pageSize);
    Task<DevotionalDetailDto?> GetByIdAsync(int id);
    Task<DevotionalDetailDto?> GetTodayAsync();
    Task<DevotionalDetailDto> CreateAsync(CreateDevotionalDto dto);
    Task<DevotionalDetailDto?> UpdateAsync(int id, UpdateDevotionalDto dto);
    Task<bool> DeleteAsync(int id);
}
```

**Understanding `Task<...>`:** The word `Task` means this operation is **asynchronous** — it might take time (e.g., waiting for a database query or an HTTP call) and does not block the server from handling other requests while waiting.

---

## Step 2: Implement the Bible API Service

This service calls the external bible-api.com to fetch verse data and caches the Verse of the Day in the database.

Create `src/Timilehin.Api/Services/BibleApiService.cs`:

```csharp
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Timilehin.Api.Data;
using Timilehin.Api.DTOs;
using Timilehin.Api.Models;

namespace Timilehin.Api.Services;

public class BibleApiService : IBibleService
{
    private readonly HttpClient _httpClient;
    private readonly AppDbContext _db;
    private readonly ILogger<BibleApiService> _logger;

    // A curated list of popular verses for daily rotation
    private static readonly string[] DailyVerses =
    [
        "John 3:16", "Psalm 23:1-6", "Philippians 4:13", "Jeremiah 29:11",
        "Romans 8:28", "Isaiah 40:31", "Proverbs 3:5-6", "Psalm 46:10",
        "Matthew 11:28", "Romans 12:2", "Galatians 5:22-23", "Psalm 119:105",
        "2 Timothy 1:7", "Joshua 1:9", "Ephesians 2:8-9", "Psalm 37:4",
        "Matthew 6:33", "1 Corinthians 13:4-7", "Hebrews 11:1", "Psalm 91:1-2",
        "Isaiah 41:10", "Romans 15:13", "Lamentations 3:22-23", "Colossians 3:23",
        "Psalm 139:14", "1 Peter 5:7", "James 1:5", "Deuteronomy 31:6",
        "Psalm 27:1", "Matthew 5:16", "2 Corinthians 5:17"
    ];

    public BibleApiService(HttpClient httpClient, AppDbContext db,
        ILogger<BibleApiService> logger)
    {
        _httpClient = httpClient;
        _db = db;
        _logger = logger;
    }

    public async Task<VerseOfTheDayDto> GetVerseOfTheDayAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Check the database cache first
        var cached = await _db.VersesOfTheDay
            .FirstOrDefaultAsync(v => v.Date == today);
        if (cached is not null)
            return new VerseOfTheDayDto(cached.Reference, cached.Text);

        // Pick a verse based on the day of the year
        var verseRef = DailyVerses[today.DayOfYear % DailyVerses.Length];

        try
        {
            // Fetch from the external API
            var response = await _httpClient.GetAsync(
                $"https://bible-api.com/{Uri.EscapeDataString(verseRef)}");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadFromJsonAsync<JsonElement>();
            var text = json.GetProperty("text").GetString()?.Trim() ?? "";
            var reference = json.GetProperty("reference").GetString() ?? verseRef;

            // Cache in the database
            var entry = new VerseOfTheDay
            {
                Date = today,
                Reference = reference,
                Text = text
            };
            _db.VersesOfTheDay.Add(entry);
            await _db.SaveChangesAsync();

            return new VerseOfTheDayDto(reference, text);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch verse of the day");
            // Return a graceful fallback instead of crashing
            return new VerseOfTheDayDto(verseRef,
                "Unable to load verse. Please try again later.");
        }
    }

    public async Task<BibleChapterDto?> GetChapterAsync(string book, int chapter)
    {
        try
        {
            var url = $"https://bible-api.com/{Uri.EscapeDataString(book)}+{chapter}";
            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
                return null;

            var json = await response.Content.ReadFromJsonAsync<JsonElement>();
            var reference = json.GetProperty("reference").GetString()
                ?? $"{book} {chapter}";
            var translation = json.TryGetProperty("translation_name", out var t)
                ? t.GetString() ?? "WEB" : "WEB";

            var verses = new List<BibleVerseDto>();
            if (json.TryGetProperty("verses", out var versesArray))
            {
                foreach (var v in versesArray.EnumerateArray())
                {
                    var verseNum = v.GetProperty("verse").GetInt32();
                    var text = v.GetProperty("text").GetString()?.Trim() ?? "";
                    verses.Add(new BibleVerseDto(verseNum, text));
                }
            }

            return new BibleChapterDto(reference, verses, translation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch {Book} {Chapter}", book, chapter);
            return null;
        }
    }
}
```

### How GetVerseOfTheDayAsync Works (Step by Step)

1. **Get today's date** as a `DateOnly` value
2. **Check the database** — has today's verse already been fetched?
3. **If yes** — return the cached version (fast, no external call)
4. **If no** — pick a verse from the curated list using the day-of-year as an index
5. **Call bible-api.com** to get the full verse text
6. **Save it to the database** so tomorrow's first request is also cached
7. **If anything goes wrong** — return a friendly fallback message instead of an error

### How GetChapterAsync Works

1. **Build the URL** for bible-api.com (e.g., `https://bible-api.com/Genesis+1`)
2. **Call the API** and check if it succeeded
3. **Parse the JSON response** — extract the reference, translation, and each verse
4. **Return the data** as a `BibleChapterDto`
5. **If anything goes wrong** — return null (the controller will convert this to a 404)

---

## Step 3: Implement the Devotional Service

This service manages CRUD operations for devotionals in the SQLite database.

Create `src/Timilehin.Api/Services/DevotionalService.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Timilehin.Api.Data;
using Timilehin.Api.DTOs;
using Timilehin.Api.Models;

namespace Timilehin.Api.Services;

public class DevotionalService : IDevotionalService
{
    private readonly AppDbContext _db;

    public DevotionalService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResult<DevotionalSummaryDto>> GetAllAsync(
        int page, int pageSize)
    {
        var query = _db.Devotionals.OrderByDescending(d => d.Date);
        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new DevotionalSummaryDto(
                d.Id,
                d.Title,
                d.Date,
                d.ScriptureReference,
                d.ReflectionText.Length > 150
                    ? d.ReflectionText.Substring(0, 150) + "..."
                    : d.ReflectionText))
            .ToListAsync();

        return new PaginatedResult<DevotionalSummaryDto>(
            items, totalCount, page, pageSize);
    }

    public async Task<DevotionalDetailDto?> GetByIdAsync(int id)
    {
        var d = await _db.Devotionals.FindAsync(id);
        return d is null ? null : ToDetailDto(d);
    }

    public async Task<DevotionalDetailDto?> GetTodayAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var d = await _db.Devotionals
            .FirstOrDefaultAsync(d => d.Date == today);
        return d is null ? null : ToDetailDto(d);
    }

    public async Task<DevotionalDetailDto> CreateAsync(CreateDevotionalDto dto)
    {
        var devotional = new Devotional
        {
            Title = dto.Title,
            Date = dto.Date,
            ScriptureReference = dto.ScriptureReference,
            ReflectionText = dto.ReflectionText,
            PrayerPrompt = dto.PrayerPrompt
        };

        _db.Devotionals.Add(devotional);
        await _db.SaveChangesAsync();

        return ToDetailDto(devotional);
    }

    public async Task<DevotionalDetailDto?> UpdateAsync(
        int id, UpdateDevotionalDto dto)
    {
        var devotional = await _db.Devotionals.FindAsync(id);
        if (devotional is null) return null;

        // Only update fields that were provided
        if (dto.Title is not null) devotional.Title = dto.Title;
        if (dto.Date.HasValue) devotional.Date = dto.Date.Value;
        if (dto.ScriptureReference is not null)
            devotional.ScriptureReference = dto.ScriptureReference;
        if (dto.ReflectionText is not null)
            devotional.ReflectionText = dto.ReflectionText;
        if (dto.PrayerPrompt is not null)
            devotional.PrayerPrompt = dto.PrayerPrompt;

        await _db.SaveChangesAsync();
        return ToDetailDto(devotional);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var devotional = await _db.Devotionals.FindAsync(id);
        if (devotional is null) return false;

        _db.Devotionals.Remove(devotional);
        await _db.SaveChangesAsync();
        return true;
    }

    private static DevotionalDetailDto ToDetailDto(Devotional d) =>
        new(d.Id, d.Title, d.Date, d.ScriptureReference,
            d.ReflectionText, d.PrayerPrompt);
}
```

### Understanding Pagination (GetAllAsync)

When you have hundreds of devotionals, you do not want to load them all at once. **Pagination** loads them in pages (like a book):

- `page = 1, pageSize = 10` returns items 1-10
- `page = 2, pageSize = 10` returns items 11-20

The method:
1. Orders devotionals by date (newest first)
2. Counts the total
3. Skips past previous pages: `Skip((page - 1) * pageSize)`
4. Takes only the current page: `Take(pageSize)`
5. Converts each devotional to a summary (with a truncated excerpt)
6. Returns the items plus metadata (total count, has next page, etc.)

### Understanding Partial Updates (UpdateAsync)

The `if (dto.Title is not null)` pattern means: "only change this field if the caller provided a new value." This way, to change just the title, you send `{ "title": "New Title" }` without having to resend every other field.

---

## Step 4: Register Services in Program.cs

Add these lines to `Program.cs` after the database registration:

```csharp
using Timilehin.Api.Services;

// ... after AddDbContext ...

builder.Services.AddHttpClient<IBibleService, BibleApiService>();
builder.Services.AddScoped<IDevotionalService, DevotionalService>();
```

**What `AddHttpClient` does:** It registers `BibleApiService` and provides it with a managed `HttpClient` for making web requests. The framework handles connection pooling and lifecycle.

**What `AddScoped` does:** It creates a new `DevotionalService` for each HTTP request. This is important because the database context (`AppDbContext`) is also scoped per request.

---

## Alternative Stack: Python (Flask)

```python
# app/services/bible_service.py
import requests
from datetime import date
from app.models import db, VerseOfTheDay

DAILY_VERSES = [
    "John 3:16", "Psalm 23:1-6", "Philippians 4:13",
    "Jeremiah 29:11", "Romans 8:28", "Isaiah 40:31",
    # ... more verses
]

def get_verse_of_the_day():
    today = date.today()
    cached = VerseOfTheDay.query.filter_by(date=today).first()
    if cached:
        return {"reference": cached.reference, "text": cached.text}

    verse_ref = DAILY_VERSES[today.timetuple().tm_yday % len(DAILY_VERSES)]

    try:
        response = requests.get(f"https://bible-api.com/{verse_ref}")
        response.raise_for_status()
        data = response.json()

        entry = VerseOfTheDay(
            date=today,
            reference=data["reference"],
            text=data["text"].strip()
        )
        db.session.add(entry)
        db.session.commit()

        return {"reference": data["reference"], "text": data["text"].strip()}
    except Exception:
        return {"reference": verse_ref, "text": "Unable to load verse."}

def get_chapter(book, chapter):
    try:
        response = requests.get(f"https://bible-api.com/{book}+{chapter}")
        if response.status_code != 200:
            return None
        data = response.json()
        return {
            "reference": data["reference"],
            "verses": [{"verse": v["verse"], "text": v["text"].strip()}
                       for v in data.get("verses", [])],
            "translation": data.get("translation_name", "WEB")
        }
    except Exception:
        return None
```

## Alternative Stack: Node.js (Express)

```javascript
// services/bibleService.js
const axios = require('axios');

const DAILY_VERSES = [
  "John 3:16", "Psalm 23:1-6", "Philippians 4:13",
  // ... more verses
];

async function getVerseOfTheDay(db) {
  const today = new Date().toISOString().split('T')[0];
  const cached = db.prepare(
    'SELECT * FROM verses_of_the_day WHERE date = ?'
  ).get(today);

  if (cached) return { reference: cached.reference, text: cached.text };

  const dayOfYear = Math.floor(
    (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  const verseRef = DAILY_VERSES[dayOfYear % DAILY_VERSES.length];

  try {
    const { data } = await axios.get(
      `https://bible-api.com/${encodeURIComponent(verseRef)}`
    );
    db.prepare(
      'INSERT INTO verses_of_the_day (date, reference, text) VALUES (?, ?, ?)'
    ).run(today, data.reference, data.text.trim());
    return { reference: data.reference, text: data.text.trim() };
  } catch {
    return { reference: verseRef, text: "Unable to load verse." };
  }
}

module.exports = { getVerseOfTheDay };
```

---

[<<< Back to Database & Models](04-database-and-models.md) | [Next: Backend API Endpoints >>>](06-backend-controllers.md)
