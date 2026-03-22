using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Timilehin.Api.Data;
using Timilehin.Api.DTOs;
using Timilehin.Api.Models;

namespace Timilehin.Api.Tests;

public class DevotionalsControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true };

    public DevotionalsControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private HttpClient CreateClientWithData(Action<AppDbContext>? seed = null)
    {
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                db.Database.EnsureCreated();
                // Clear existing data
                db.Devotionals.RemoveRange(db.Devotionals);
                db.SaveChanges();
                seed?.Invoke(db);
            });
        }).CreateClient();
        return client;
    }

    private static Devotional MakeDevotional(int id, string title, DateOnly date, string reflection = "Short reflection.")
    {
        return new Devotional
        {
            Id = id,
            Title = title,
            Date = date,
            ScriptureReference = "John 3:16",
            ReflectionText = reflection,
            PrayerPrompt = "Lord, help me.",
            CreatedAt = DateTime.UtcNow
        };
    }

    // ─── L2-8.1: GET /api/devotionals ───────────────────────────────────

    [Fact]
    public async Task GetAll_ReturnsPaginatedList_OrderedByDateDesc()
    {
        // Arrange - seed 3 devotionals with different dates
        var client = CreateClientWithData(db =>
        {
            db.Devotionals.AddRange(
                MakeDevotional(1, "Day One", new DateOnly(2026, 1, 1)),
                MakeDevotional(2, "Day Three", new DateOnly(2026, 1, 3)),
                MakeDevotional(3, "Day Two", new DateOnly(2026, 1, 2))
            );
            db.SaveChanges();
        });

        // Act
        var response = await client.GetAsync("/api/devotionals");

        // Assert
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();

        var items = json.GetProperty("items");
        Assert.Equal(3, items.GetArrayLength());

        // Verify ordering: most recent first
        var dates = items.EnumerateArray()
            .Select(i => i.GetProperty("date").GetString())
            .ToList();
        Assert.Equal("2026-01-03", dates[0]);
        Assert.Equal("2026-01-02", dates[1]);
        Assert.Equal("2026-01-01", dates[2]);

        // Verify pagination metadata
        Assert.Equal(3, json.GetProperty("totalCount").GetInt32());
        Assert.Equal(1, json.GetProperty("page").GetInt32());
        Assert.True(json.TryGetProperty("totalPages", out _));
    }

    [Fact]
    public async Task GetAll_ExcerptIsTruncatedAt150Chars()
    {
        var longText = new string('A', 200);
        var client = CreateClientWithData(db =>
        {
            db.Devotionals.Add(MakeDevotional(1, "Long Reflection", new DateOnly(2026, 1, 1), longText));
            db.SaveChanges();
        });

        var response = await client.GetAsync("/api/devotionals");
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var excerpt = json.GetProperty("items")[0].GetProperty("excerpt").GetString()!;

        // Excerpt should be 150 chars + "..."
        Assert.Equal(153, excerpt.Length);
        Assert.EndsWith("...", excerpt);
    }

    [Fact]
    public async Task GetAll_ShortReflection_ExcerptNotTruncated()
    {
        var shortText = "Short reflection.";
        var client = CreateClientWithData(db =>
        {
            db.Devotionals.Add(MakeDevotional(1, "Short", new DateOnly(2026, 1, 1), shortText));
            db.SaveChanges();
        });

        var response = await client.GetAsync("/api/devotionals");
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var excerpt = json.GetProperty("items")[0].GetProperty("excerpt").GetString();
        Assert.Equal(shortText, excerpt);
    }

    [Fact]
    public async Task GetAll_PaginationWorks()
    {
        var client = CreateClientWithData(db =>
        {
            for (int i = 1; i <= 15; i++)
            {
                db.Devotionals.Add(MakeDevotional(i, $"Day {i}", new DateOnly(2026, 1, i)));
            }
            db.SaveChanges();
        });

        // Request page 2 with pageSize 5
        var response = await client.GetAsync("/api/devotionals?page=2&pageSize=5");
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(5, json.GetProperty("items").GetArrayLength());
        Assert.Equal(15, json.GetProperty("totalCount").GetInt32());
        Assert.Equal(2, json.GetProperty("page").GetInt32());
        Assert.Equal(5, json.GetProperty("pageSize").GetInt32());
        Assert.Equal(3, json.GetProperty("totalPages").GetInt32());
        Assert.True(json.GetProperty("hasNextPage").GetBoolean());
        Assert.True(json.GetProperty("hasPreviousPage").GetBoolean());
    }

    // ─── L2-8.2: GET /api/devotionals/{id} ─────────────────────────────

    [Fact]
    public async Task GetById_ReturnsFullDetail()
    {
        var client = CreateClientWithData(db =>
        {
            db.Devotionals.Add(MakeDevotional(1, "Test Devotional", new DateOnly(2026, 3, 15),
                "Full reflection text here."));
            db.SaveChanges();
        });

        var response = await client.GetAsync("/api/devotionals/1");
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, json.GetProperty("id").GetInt32());
        Assert.Equal("Test Devotional", json.GetProperty("title").GetString());
        Assert.Equal("2026-03-15", json.GetProperty("date").GetString());
        Assert.Equal("John 3:16", json.GetProperty("scriptureReference").GetString());
        Assert.Equal("Full reflection text here.", json.GetProperty("reflectionText").GetString());
        Assert.Equal("Lord, help me.", json.GetProperty("prayerPrompt").GetString());
    }

    [Fact]
    public async Task GetById_Returns404_WhenNotFound()
    {
        var client = CreateClientWithData();

        var response = await client.GetAsync("/api/devotionals/999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ─── L2-8.3: GET /api/devotionals/today ─────────────────────────────

    [Fact]
    public async Task GetToday_ReturnsTodaysDevotional()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var client = CreateClientWithData(db =>
        {
            db.Devotionals.Add(MakeDevotional(1, "Today's Word", today, "Today's reflection."));
            db.SaveChanges();
        });

        var response = await client.GetAsync("/api/devotionals/today");
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Today's Word", json.GetProperty("title").GetString());
        Assert.Equal(today.ToString("yyyy-MM-dd"), json.GetProperty("date").GetString());
    }

    [Fact]
    public async Task GetToday_Returns404_WhenNoDevotionalForToday()
    {
        var client = CreateClientWithData(db =>
        {
            // Seed a devotional for a past date only
            db.Devotionals.Add(MakeDevotional(1, "Old Word", new DateOnly(2020, 1, 1)));
            db.SaveChanges();
        });

        var response = await client.GetAsync("/api/devotionals/today");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ─── L2-8.4: POST /api/devotionals ──────────────────────────────────

    [Fact]
    public async Task Create_Returns201WithLocationHeader()
    {
        var client = CreateClientWithData();

        var dto = new
        {
            Title = "New Devotional",
            Date = "2026-06-01",
            ScriptureReference = "Psalm 23:1",
            ReflectionText = "The Lord is my shepherd.",
            PrayerPrompt = "Thank you Lord."
        };

        var response = await client.PostAsJsonAsync("/api/devotionals", dto);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        // Verify Location header is present and points to the new resource
        Assert.NotNull(response.Headers.Location);
        Assert.Contains("/api/devotionals/", response.Headers.Location!.ToString(), StringComparison.OrdinalIgnoreCase);

        // Verify response body
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("New Devotional", json.GetProperty("title").GetString());
        Assert.Equal("Psalm 23:1", json.GetProperty("scriptureReference").GetString());
        Assert.True(json.GetProperty("id").GetInt32() > 0);
    }

    [Fact]
    public async Task Create_DevotionalIsPersisted()
    {
        var client = CreateClientWithData();

        var dto = new
        {
            Title = "Persisted Devotional",
            Date = "2026-07-01",
            ScriptureReference = "Genesis 1:1",
            ReflectionText = "In the beginning...",
            PrayerPrompt = "Creator God..."
        };

        var createResponse = await client.PostAsJsonAsync("/api/devotionals", dto);
        createResponse.EnsureSuccessStatusCode();

        var created = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var id = created.GetProperty("id").GetInt32();

        // Verify we can fetch it
        var getResponse = await client.GetAsync($"/api/devotionals/{id}");
        getResponse.EnsureSuccessStatusCode();

        var fetched = await getResponse.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Persisted Devotional", fetched.GetProperty("title").GetString());
    }

    // ─── L2-8.5: PUT /api/devotionals/{id} ──────────────────────────────

    [Fact]
    public async Task Update_PartialUpdate_OnlyChangesProvidedFields()
    {
        var client = CreateClientWithData(db =>
        {
            db.Devotionals.Add(MakeDevotional(1, "Original Title", new DateOnly(2026, 3, 1),
                "Original reflection."));
            db.SaveChanges();
        });

        // Only update the title
        var dto = new { Title = "Updated Title" };
        var response = await client.PutAsJsonAsync("/api/devotionals/1", dto);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Updated Title", json.GetProperty("title").GetString());
        // Other fields should remain unchanged
        Assert.Equal("Original reflection.", json.GetProperty("reflectionText").GetString());
        Assert.Equal("John 3:16", json.GetProperty("scriptureReference").GetString());
    }

    [Fact]
    public async Task Update_Returns404_WhenNotFound()
    {
        var client = CreateClientWithData();

        var dto = new { Title = "Doesn't matter" };
        var response = await client.PutAsJsonAsync("/api/devotionals/999", dto);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ─── L2-8.6: DELETE /api/devotionals/{id} ───────────────────────────

    [Fact]
    public async Task Delete_Returns204()
    {
        var client = CreateClientWithData(db =>
        {
            db.Devotionals.Add(MakeDevotional(1, "To Delete", new DateOnly(2026, 4, 1)));
            db.SaveChanges();
        });

        var response = await client.DeleteAsync("/api/devotionals/1");
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // Verify it's gone
        var getResponse = await client.GetAsync("/api/devotionals/1");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task Delete_Returns404_WhenNotFound()
    {
        var client = CreateClientWithData();

        var response = await client.DeleteAsync("/api/devotionals/999");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
