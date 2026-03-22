namespace Timilehin.Api.DTOs;

public record VerseOfTheDayDto(string Reference, string Text);

public record BibleChapterDto(string Reference, List<BibleVerseDto> Verses, string Translation);

public record BibleVerseDto(int Verse, string Text);
