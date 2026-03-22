namespace Timilehin.Api.DTOs;

public record DevotionalSummaryDto(int Id, string Title, DateOnly Date, string ScriptureReference, string Excerpt);

public record DevotionalDetailDto(
    int Id,
    string Title,
    DateOnly Date,
    string ScriptureReference,
    string ReflectionText,
    string PrayerPrompt);

public record CreateDevotionalDto(
    string Title,
    DateOnly Date,
    string ScriptureReference,
    string ReflectionText,
    string PrayerPrompt);

public record UpdateDevotionalDto(
    string? Title,
    DateOnly? Date,
    string? ScriptureReference,
    string? ReflectionText,
    string? PrayerPrompt);
