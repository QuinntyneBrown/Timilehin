using Timilehin.Api.DTOs;

namespace Timilehin.Api.Services;

public interface IBibleService
{
    Task<VerseOfTheDayDto> GetVerseOfTheDayAsync();
    Task<BibleChapterDto?> GetChapterAsync(string book, int chapter);
}
