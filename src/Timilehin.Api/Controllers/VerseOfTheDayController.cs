using Microsoft.AspNetCore.Mvc;
using Timilehin.Api.Services;

namespace Timilehin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VerseOfTheDayController : ControllerBase
{
    private readonly IBibleService _bibleService;

    public VerseOfTheDayController(IBibleService bibleService)
    {
        _bibleService = bibleService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var verse = await _bibleService.GetVerseOfTheDayAsync();
        return Ok(verse);
    }
}
