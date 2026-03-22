using Microsoft.AspNetCore.Mvc;
using Timilehin.Api.DTOs;
using Timilehin.Api.Services;

namespace Timilehin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DevotionalsController : ControllerBase
{
    private readonly IDevotionalService _devotionalService;

    public DevotionalsController(IDevotionalService devotionalService)
    {
        _devotionalService = devotionalService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        if (page < 1) page = 1;
        if (pageSize is < 1 or > 50) pageSize = 10;

        var result = await _devotionalService.GetAllAsync(page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var devotional = await _devotionalService.GetByIdAsync(id);
        if (devotional is null)
            return NotFound();

        return Ok(devotional);
    }

    [HttpGet("today")]
    public async Task<IActionResult> GetToday()
    {
        var devotional = await _devotionalService.GetTodayAsync();
        if (devotional is null)
            return NotFound(new { message = "No devotional available for today." });

        return Ok(devotional);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDevotionalDto dto)
    {
        var devotional = await _devotionalService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = devotional.Id }, devotional);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDevotionalDto dto)
    {
        var devotional = await _devotionalService.UpdateAsync(id, dto);
        if (devotional is null)
            return NotFound();

        return Ok(devotional);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _devotionalService.DeleteAsync(id);
        if (!deleted)
            return NotFound();

        return NoContent();
    }
}
