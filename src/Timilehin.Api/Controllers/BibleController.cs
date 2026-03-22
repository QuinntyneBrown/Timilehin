using Microsoft.AspNetCore.Mvc;
using Timilehin.Api.Services;

namespace Timilehin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BibleController : ControllerBase
{
    private readonly IBibleService _bibleService;

    public BibleController(IBibleService bibleService)
    {
        _bibleService = bibleService;
    }

    [HttpGet("{book}/{chapter:int}")]
    public async Task<IActionResult> GetChapter(string book, int chapter)
    {
        var result = await _bibleService.GetChapterAsync(book, chapter);
        if (result is null)
            return NotFound(new { message = $"Could not find {book} chapter {chapter}." });

        return Ok(result);
    }
}
