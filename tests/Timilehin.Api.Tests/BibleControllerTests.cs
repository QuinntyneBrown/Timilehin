using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace Timilehin.Api.Tests;

public class BibleControllerTests : IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly MockHttpMessageHandler _mockHandler;

    public BibleControllerTests()
    {
        _mockHandler = new MockHttpMessageHandler();
        _factory = new CustomWebApplicationFactory { BibleApiHandler = _mockHandler };
    }

    public void Dispose()
    {
        _factory.Dispose();
        _mockHandler.Dispose();
    }

    [Fact]
    public async Task GetChapter_Genesis1_Returns200WithExpectedJson()
    {
        // Arrange
        var bibleApiResponse = new
        {
            reference = "Genesis 1",
            translation_name = "World English Bible",
            verses = new[]
            {
                new { verse = 1, text = "In the beginning, God created the heavens and the earth." },
                new { verse = 2, text = "The earth was formless and empty." }
            }
        };
        _mockHandler.SetupResponse("https://bible-api.com/Genesis+1", HttpStatusCode.OK,
            JsonSerializer.Serialize(bibleApiResponse));

        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/bible/Genesis/1");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal("Genesis 1", json.GetProperty("reference").GetString());
        Assert.Equal("World English Bible", json.GetProperty("translation").GetString());

        var verses = json.GetProperty("verses");
        Assert.Equal(JsonValueKind.Array, verses.ValueKind);
        Assert.Equal(2, verses.GetArrayLength());

        var firstVerse = verses[0];
        Assert.Equal(1, firstVerse.GetProperty("verse").GetInt32());
        Assert.Equal("In the beginning, God created the heavens and the earth.", firstVerse.GetProperty("text").GetString());
    }

    [Fact]
    public async Task GetChapter_EachVerseHasVerseNumberAndText()
    {
        // Arrange
        var bibleApiResponse = new
        {
            reference = "Psalm 23",
            translation_name = "WEB",
            verses = new[]
            {
                new { verse = 1, text = "The LORD is my shepherd; I shall not want." },
                new { verse = 2, text = "He makes me lie down in green pastures." },
                new { verse = 3, text = "He restores my soul." }
            }
        };
        _mockHandler.SetupResponse("https://bible-api.com/Psalm+23", HttpStatusCode.OK,
            JsonSerializer.Serialize(bibleApiResponse));

        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/bible/Psalm/23");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        var verses = json.GetProperty("verses");

        foreach (var verse in verses.EnumerateArray())
        {
            // Each verse must have a "verse" number (integer)
            Assert.True(verse.TryGetProperty("verse", out var verseNum));
            Assert.Equal(JsonValueKind.Number, verseNum.ValueKind);
            Assert.True(verseNum.GetInt32() > 0);

            // Each verse must have a "text" string
            Assert.True(verse.TryGetProperty("text", out var text));
            Assert.Equal(JsonValueKind.String, text.ValueKind);
            Assert.False(string.IsNullOrWhiteSpace(text.GetString()));
        }
    }

    [Fact]
    public async Task GetChapter_InvalidBook_Returns404WithMessage()
    {
        // Arrange - bible-api.com returns 404 for invalid books
        _mockHandler.SetupResponse("https://bible-api.com/FakeBook+99", HttpStatusCode.NotFound, "");

        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/bible/FakeBook/99");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(json.TryGetProperty("message", out var message));
        var messageText = message.GetString();
        Assert.NotNull(messageText);
        Assert.Contains("FakeBook", messageText);
    }

    [Fact]
    public async Task GetChapter_MultiWordBookName_Returns200()
    {
        // Arrange
        var bibleApiResponse = new
        {
            reference = "1 Corinthians 13",
            translation_name = "WEB",
            verses = new[]
            {
                new { verse = 1, text = "If I speak with the languages of men and of angels, but don't have love, I have become a noisy gong." }
            }
        };
        // URL-encoded: "1 Corinthians" -> "1%20Corinthians"
        _mockHandler.SetupResponse("https://bible-api.com/1%20Corinthians+13", HttpStatusCode.OK,
            JsonSerializer.Serialize(bibleApiResponse));

        var client = _factory.CreateClient();

        // Act - space in URL is sent as "1 Corinthians" which ASP.NET will decode from "1%20Corinthians"
        var response = await client.GetAsync("/api/bible/1%20Corinthians/13");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("1 Corinthians 13", json.GetProperty("reference").GetString());
        Assert.True(json.GetProperty("verses").GetArrayLength() > 0);
    }

    [Fact]
    public async Task GetChapter_InvalidChapterForValidBook_Returns404()
    {
        // Arrange - Genesis has 50 chapters, so chapter 999 should fail
        _mockHandler.SetupResponse("https://bible-api.com/Genesis+999", HttpStatusCode.NotFound, "");

        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/bible/Genesis/999");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Contains("Genesis", json.GetProperty("message").GetString()!);
        Assert.Contains("999", json.GetProperty("message").GetString()!);
    }
}

/// <summary>
/// A test-friendly HttpMessageHandler that returns pre-configured responses based on request URL.
/// </summary>
public class MockHttpMessageHandler : HttpMessageHandler
{
    private readonly Dictionary<string, (HttpStatusCode StatusCode, string Content)> _responses = new();

    public void SetupResponse(string url, HttpStatusCode statusCode, string content)
    {
        _responses[url] = (statusCode, content);
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var url = request.RequestUri?.ToString() ?? "";

        if (_responses.TryGetValue(url, out var configured))
        {
            return Task.FromResult(new HttpResponseMessage(configured.StatusCode)
            {
                Content = new StringContent(configured.Content, System.Text.Encoding.UTF8, "application/json")
            });
        }

        // Default: return 404 for any unconfigured URL
        return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound)
        {
            Content = new StringContent("{}", System.Text.Encoding.UTF8, "application/json")
        });
    }
}
