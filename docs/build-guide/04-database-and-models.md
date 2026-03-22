# 04 — Database & Models

In this chapter, you will define the shape of your data (models) and set up the database connection. By the end, your app will have a working SQLite database that creates itself automatically.

---

## What Are Models?

Models are C# classes that define the structure of your data. Each model corresponds to a **table** in the database. Each property of the model corresponds to a **column** in that table.

Think of a model like a form template:
- The model defines which fields exist (Title, Date, etc.)
- Each row in the database is one filled-out form

---

## Step 1: Create the Devotional Model

Create a new file at `src/Timilehin.Api/Models/Devotional.cs`:

```csharp
namespace Timilehin.Api.Models;

public class Devotional
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public DateOnly Date { get; set; }
    public required string ScriptureReference { get; set; }
    public required string ReflectionText { get; set; }
    public required string PrayerPrompt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

**What each line means:**

| Property | Type | Purpose |
|----------|------|---------|
| `Id` | `int` | A unique number for each devotional (auto-generated) |
| `Title` | `string` | The devotional's title (e.g., "Walking in Faith") |
| `Date` | `DateOnly` | The date this devotional is for |
| `ScriptureReference` | `string` | The Bible verse reference (e.g., "Psalm 23:1-6") |
| `ReflectionText` | `string` | The main devotional body text |
| `PrayerPrompt` | `string` | A closing prayer suggestion |
| `CreatedAt` | `DateTime` | When this record was created (defaults to "now") |

The `required` keyword means these fields must be provided when creating a new devotional — they cannot be left empty.

---

## Step 2: Create the Verse of the Day Model

Create `src/Timilehin.Api/Models/VerseOfTheDay.cs`:

```csharp
namespace Timilehin.Api.Models;

public class VerseOfTheDay
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public required string Reference { get; set; }
    public required string Text { get; set; }
}
```

This is simpler — it just stores the date, the verse reference, and the verse text. We cache one verse per day so we do not keep calling the external Bible API.

---

## Step 3: Create the Database Context

The **DbContext** is the bridge between your C# models and the SQLite database. It tells Entity Framework which tables exist.

Create `src/Timilehin.Api/Data/AppDbContext.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Timilehin.Api.Models;

namespace Timilehin.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Devotional> Devotionals => Set<Devotional>();
    public DbSet<VerseOfTheDay> VersesOfTheDay => Set<VerseOfTheDay>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Devotional>(entity =>
        {
            entity.HasIndex(d => d.Date).IsUnique();
        });

        modelBuilder.Entity<VerseOfTheDay>(entity =>
        {
            entity.HasIndex(v => v.Date).IsUnique();
        });
    }
}
```

**What this does:**

- `DbSet<Devotional> Devotionals` — declares a "Devotionals" table in the database
- `DbSet<VerseOfTheDay> VersesOfTheDay` — declares a "VersesOfTheDay" table
- `OnModelCreating` — adds configuration rules:
  - `HasIndex(d => d.Date).IsUnique()` — each date can only appear once (you cannot have two devotionals for the same day, or two cached verses for the same day)

---

## Step 4: Create the DTOs

**DTOs** (Data Transfer Objects) define the shape of data sent over the API. They are separate from models because you may not want to expose every database field to the frontend.

Create `src/Timilehin.Api/DTOs/BibleDto.cs`:

```csharp
namespace Timilehin.Api.DTOs;

public record VerseOfTheDayDto(string Reference, string Text);

public record BibleChapterDto(string Reference, List<BibleVerseDto> Verses, string Translation);

public record BibleVerseDto(int Verse, string Text);
```

Create `src/Timilehin.Api/DTOs/DevotionalDto.cs`:

```csharp
namespace Timilehin.Api.DTOs;

public record DevotionalSummaryDto(
    int Id, string Title, DateOnly Date, string ScriptureReference, string Excerpt);

public record DevotionalDetailDto(
    int Id, string Title, DateOnly Date, string ScriptureReference,
    string ReflectionText, string PrayerPrompt);

public record CreateDevotionalDto(
    string Title, DateOnly Date, string ScriptureReference,
    string ReflectionText, string PrayerPrompt);

public record UpdateDevotionalDto(
    string? Title, DateOnly? Date, string? ScriptureReference,
    string? ReflectionText, string? PrayerPrompt);
```

Create `src/Timilehin.Api/DTOs/PaginatedResult.cs`:

```csharp
namespace Timilehin.Api.DTOs;

public record PaginatedResult<T>(
    List<T> Items,
    int TotalCount,
    int Page,
    int PageSize)
{
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}
```

**Understanding `record` vs `class`:**
- A `record` is a lightweight class designed for holding data. It automatically gives you equality comparison and a nice `ToString()`.
- Think of records as "data containers" and classes as "things that do stuff."

**Understanding the `?` after types:**
- `string?` means "this field is optional — it can be missing"
- Used in `UpdateDevotionalDto` because when updating, you only send the fields you want to change

---

## Step 5: Configure the Database Connection

Open `src/Timilehin.Api/appsettings.json` and add the connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=graceword.db"
  },
  "Cors": {
    "Origins": ["http://localhost:3000", "http://localhost:4200"]
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

`"Data Source=graceword.db"` tells SQLite to store the database in a file called `graceword.db` in the project folder.

---

## Step 6: Register the Database in Program.cs

Open `src/Timilehin.Api/Program.cs` and add these lines near the top:

```csharp
using Microsoft.EntityFrameworkCore;
using Timilehin.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Add this: register the database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
```

And after `var app = builder.Build();`, add:

```csharp
// Add this: auto-create database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
}
```

`EnsureCreatedAsync()` checks if the database file exists. If not, it creates the file and all the tables based on your models. This means you never have to manually set up the database.

---

## Verify

Build the project to make sure there are no errors:

```bash
dotnet build Timilehin.slnx
```

---

## Alternative Stack: Python (SQLAlchemy)

```python
# app/models.py
from flask_sqlalchemy import SQLAlchemy
from datetime import date, datetime

db = SQLAlchemy()

class Devotional(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    date = db.Column(db.Date, nullable=False, unique=True)
    scripture_reference = db.Column(db.String(100), nullable=False)
    reflection_text = db.Column(db.Text, nullable=False)
    prayer_prompt = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class VerseOfTheDay(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, unique=True)
    reference = db.Column(db.String(100), nullable=False)
    text = db.Column(db.Text, nullable=False)
```

## Alternative Stack: Node.js (Prisma)

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./graceword.db"
}

model Devotional {
  id                 Int      @id @default(autoincrement())
  title              String
  date               DateTime @unique
  scriptureReference String
  reflectionText     String
  prayerPrompt       String
  createdAt          DateTime @default(now())
}

model VerseOfTheDay {
  id        Int      @id @default(autoincrement())
  date      DateTime @unique
  reference String
  text      String
}
```

Then run `npx prisma migrate dev` to create the database.

## Alternative Stack: Java (Spring Data JPA)

```java
// src/main/java/com/graceword/api/model/Devotional.java
@Entity
@Table(name = "devotionals")
public class Devotional {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, unique = true)
    private LocalDate date;

    @Column(nullable = false)
    private String scriptureReference;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reflectionText;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prayerPrompt;

    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters and setters...
}
```

---

[<<< Back to Backend Project Setup](03-backend-project-setup.md) | [Next: Backend Services >>>](05-backend-services.md)
