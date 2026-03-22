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
