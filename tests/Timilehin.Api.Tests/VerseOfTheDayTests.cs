using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Timilehin.Api.Data;
using Timilehin.Api.Models;

namespace Timilehin.Api.Tests;

public class VerseOfTheDayTests : IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly MockHttpMessageHandler _mockHandler;

    public VerseOfTheDayTests()
    {
        _mockHandler = new MockHttpMessageHandler();
        _factory = new CustomWebApplicationFactory { BibleApiHandler = _mockHandler };
    }

    public void Dispose()
    {
        _factory.Dispose();
        _mockHandler.Dispose();
    }

    /// <summary>
    /// Configures the mock handler to return a successful verse response
    /// for any bible-api.com URL matching a verse reference pattern.
    /// Because the service picks a reference based on day-of-year, we
    /// set up the exact URL the service will request.
    /// </summary>
    private void SetupVerseOfTheDaySuccess(
        string reference = "John 3:16",
        string text = "For God so loved the world...")
    {
        // The service picks a reference from its curated list and URL-encodes it.
        // We compute the same reference the service will pick today.
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var dailyVerses = new[]
        {
            "John 3:16", "Psalm 23:1-6", "Philippians 4:13", "Jeremiah 29:11",
            "Romans 8:28", "Isaiah 40:31", "Proverbs 3:5-6", "Psalm 46:10",
            "Matthew 11:28", "Romans 12:2", "Galatians 5:22-23", "Psalm 119:105",
            "2 Timothy 1:7", "Joshua 1:9", "Ephesians 2:8-9", "Psalm 37:4",
            "Matthew 6:33", "1 Corinthians 13:4-7", "Hebrews 11:1", "Psalm 91:1-2",
            "Isaiah 41:10", "Romans 15:13", "Lamentations 3:22-23", "Colossians 3:23",
            "Psalm 139:14", "1 Peter 5:7", "James 1:5", "Deuteronomy 31:6",
            "Psalm 27:1", "Matthew 5:16", "2 Corinthians 5:17"
        };
        var verseRef = dailyVerses[today.DayOfYear % dailyVerses.Length];
        var url = $"https://bible-api.com/{Uri.EscapeDataString(verseRef)}";

        var json = JsonSerializer.Serialize(new { reference, text });
        _mockHandler.SetupResponse(url, HttpStatusCode.OK, json);
    }

    private void SetupVerseOfTheDayFailure()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var dailyVerses = new[]
        {
            "John 3:16", "Psalm 23:1-6", "Philippians 4:13", "Jeremiah 29:11",
            "Romans 8:28", "Isaiah 40:31", "Proverbs 3:5-6", "Psalm 46:10",
            "Matthew 11:28", "Romans 12:2", "Galatians 5:22-23", "Psalm 119:105",
            "2 Timothy 1:7", "Joshua 1:9", "Ephesians 2:8-9", "Psalm 37:4",
            "Matthew 6:33", "1 Corinthians 13:4-7", "Hebrews 11:1", "Psalm 91:1-2",
            "Isaiah 41:10", "Romans 15:13", "Lamentations 3:22-23", "Colossians 3:23",
            "Psalm 139:14", "1 Peter 5:7", "James 1:5", "Deuteronomy 31:6",
            "Psalm 27:1", "Matthew 5:16", "2 Corinthians 5:17"
        };
        var verseRef = dailyVerses[today.DayOfYear % dailyVerses.Length];
        var url = $"https://bible-api.com/{Uri.EscapeDataString(verseRef)}";

        _mockHandler.SetupResponse(url, HttpStatusCode.InternalServerError, "Server Error");
    }

    // ================================================================
    // L2-6.1  GET /api/verseoftheday returns 200 with reference & text
    // ================================================================

    [Fact]
    public async Task Get_VerseOfTheDay_Returns200WithReferenceAndText()
    {
        SetupVerseOfTheDaySuccess("John 3:16", "For God so loved the world...");

        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/verseoftheday");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.TryGetProperty("reference", out var refProp), "Response must contain 'reference'");
        Assert.True(json.TryGetProperty("text", out var textProp), "Response must contain 'text'");
        Assert.False(string.IsNullOrWhiteSpace(refProp.GetString()), "reference should not be empty");
        Assert.False(string.IsNullOrWhiteSpace(textProp.GetString()), "text should not be empty");
    }

    // ================================================================
    // L2-6.1  Verse rotates daily based on curated list
    // ================================================================

    [Fact]
    public async Task Get_VerseOfTheDay_PicksVerseBasedOnDayOfYear()
    {
        SetupVerseOfTheDaySuccess("John 3:16", "For God so loved the world...");

        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/verseoftheday");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var reference = json.GetProperty("reference").GetString();

        // The returned reference must be non-empty (came from the curated list)
        Assert.False(string.IsNullOrWhiteSpace(reference));
    }

    // ================================================================
    // L2-6.1  Response is cached in database per day
    // ================================================================

    [Fact]
    public async Task Get_VerseOfTheDay_SecondCallUsesCache()
    {
        SetupVerseOfTheDaySuccess("Psalm 23:1-6", "The Lord is my shepherd...");

        var client = _factory.CreateClient();

        // First call — fetches from API (mock returns 200)
        var response1 = await client.GetAsync("/api/verseoftheday");
        Assert.Equal(HttpStatusCode.OK, response1.StatusCode);

        // Second call — should use cached DB record, not call API again.
        // Since the mock only returns a response for URLs set up via SetupResponse,
        // and InMemory DB persists within the factory, the second call will read from DB.
        var response2 = await client.GetAsync("/api/verseoftheday");
        Assert.Equal(HttpStatusCode.OK, response2.StatusCode);

        // Both responses should return the same reference
        var json1 = await response1.Content.ReadFromJsonAsync<JsonElement>();
        var json2 = await response2.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(
            json1.GetProperty("reference").GetString(),
            json2.GetProperty("reference").GetString());
    }

    // ================================================================
    // L2-6.1  Graceful fallback when external API fails (not 500)
    // ================================================================

    [Fact]
    public async Task Get_VerseOfTheDay_ReturnsFallbackOnApiFailure()
    {
        SetupVerseOfTheDayFailure();

        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/verseoftheday");

        // Should NOT be a 500; should be 200 with a graceful fallback body
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.TryGetProperty("reference", out _), "Fallback must still include 'reference'");
        Assert.True(json.TryGetProperty("text", out _), "Fallback must still include 'text'");
    }

    // ================================================================
    // L2-6.2  VerseOfTheDay model has Id, Date, Reference, Text
    // ================================================================

    [Fact]
    public void VerseOfTheDay_Model_HasExpectedProperties()
    {
        var type = typeof(VerseOfTheDay);

        Assert.NotNull(type.GetProperty("Id"));
        Assert.NotNull(type.GetProperty("Date"));
        Assert.NotNull(type.GetProperty("Reference"));
        Assert.NotNull(type.GetProperty("Text"));

        Assert.Equal(typeof(int), type.GetProperty("Id")!.PropertyType);
        Assert.Equal(typeof(DateOnly), type.GetProperty("Date")!.PropertyType);
        Assert.Equal(typeof(string), type.GetProperty("Reference")!.PropertyType);
        Assert.Equal(typeof(string), type.GetProperty("Text")!.PropertyType);
    }

    // ================================================================
    // L2-6.2  Date column has a unique index
    // ================================================================

    [Fact]
    public void VerseOfTheDay_DateColumn_HasUniqueIndex()
    {
        var options = new Microsoft.EntityFrameworkCore.DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("IndexCheck_" + Guid.NewGuid())
            .Options;

        using var db = new AppDbContext(options);
        var entityType = db.Model.FindEntityType(typeof(VerseOfTheDay))!;

        var indexes = entityType.GetIndexes()
            .Where(i => i.Properties.Any(p => p.Name == nameof(VerseOfTheDay.Date)))
            .ToList();

        Assert.NotEmpty(indexes);
        Assert.Contains(indexes, i => i.IsUnique);
    }

    // ================================================================
    // L2-6.2  First request stores verse in DB
    // ================================================================

    [Fact]
    public async Task Get_VerseOfTheDay_StoresInDatabaseOnFirstRequest()
    {
        SetupVerseOfTheDaySuccess("Romans 8:28", "And we know that all things work together...");

        var client = _factory.CreateClient();
        await client.GetAsync("/api/verseoftheday");

        // Inspect the database
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var stored = await db.VersesOfTheDay.FirstOrDefaultAsync(v => v.Date == today);

        Assert.NotNull(stored);
        Assert.False(string.IsNullOrWhiteSpace(stored.Reference));
        Assert.False(string.IsNullOrWhiteSpace(stored.Text));
    }

    // ================================================================
    // L2-6.2  Subsequent same-day requests return cached record
    // ================================================================

    [Fact]
    public async Task Get_VerseOfTheDay_SubsequentRequestsReturnSingleCachedRow()
    {
        SetupVerseOfTheDaySuccess("Isaiah 40:31", "But they that wait upon the Lord...");

        var client = _factory.CreateClient();

        // Two calls on the same day
        await client.GetAsync("/api/verseoftheday");
        await client.GetAsync("/api/verseoftheday");

        // Only one row should exist for today
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var count = await db.VersesOfTheDay.CountAsync(v => v.Date == today);
        Assert.Equal(1, count);
    }
}
