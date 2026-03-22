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

    // A curated list of popular verses for Verse of the Day rotation
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

    public BibleApiService(HttpClient httpClient, AppDbContext db, ILogger<BibleApiService> logger)
    {
        _httpClient = httpClient;
        _db = db;
        _logger = logger;
    }

    public async Task<VerseOfTheDayDto> GetVerseOfTheDayAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Check cache first
        var cached = await _db.VersesOfTheDay.FirstOrDefaultAsync(v => v.Date == today);
        if (cached is not null)
            return new VerseOfTheDayDto(cached.Reference, cached.Text);

        // Pick verse based on day of year for consistent daily rotation
        var verseRef = DailyVerses[today.DayOfYear % DailyVerses.Length];

        try
        {
            var response = await _httpClient.GetAsync($"https://bible-api.com/{Uri.EscapeDataString(verseRef)}");
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadFromJsonAsync<JsonElement>();
            var text = json.GetProperty("text").GetString()?.Trim() ?? "";
            var reference = json.GetProperty("reference").GetString() ?? verseRef;

            var entry = new VerseOfTheDay { Date = today, Reference = reference, Text = text };
            _db.VersesOfTheDay.Add(entry);
            await _db.SaveChangesAsync();

            return new VerseOfTheDayDto(reference, text);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to fetch verse of the day from Bible API");
            return new VerseOfTheDayDto(verseRef, "Unable to load verse. Please try again later.");
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
            var reference = json.GetProperty("reference").GetString() ?? $"{book} {chapter}";
            var translation = json.TryGetProperty("translation_name", out var t) ? t.GetString() ?? "WEB" : "WEB";

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
            _logger.LogError(ex, "Failed to fetch {Book} {Chapter} from Bible API", book, chapter);
            return null;
        }
    }
}
