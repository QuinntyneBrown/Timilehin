namespace Timilehin.Api.Models;

public class VerseOfTheDay
{
    public int Id { get; set; }
    public DateOnly Date { get; set; }
    public required string Reference { get; set; }
    public required string Text { get; set; }
}
