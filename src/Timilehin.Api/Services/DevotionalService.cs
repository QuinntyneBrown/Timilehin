using Microsoft.EntityFrameworkCore;
using Timilehin.Api.Data;
using Timilehin.Api.DTOs;
using Timilehin.Api.Models;

namespace Timilehin.Api.Services;

public class DevotionalService : IDevotionalService
{
    private readonly AppDbContext _db;

    public DevotionalService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PaginatedResult<DevotionalSummaryDto>> GetAllAsync(int page, int pageSize)
    {
        var query = _db.Devotionals.OrderByDescending(d => d.Date);
        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new DevotionalSummaryDto(
                d.Id,
                d.Title,
                d.Date,
                d.ScriptureReference,
                d.ReflectionText.Length > 150 ? d.ReflectionText.Substring(0, 150) + "..." : d.ReflectionText))
            .ToListAsync();

        return new PaginatedResult<DevotionalSummaryDto>(items, totalCount, page, pageSize);
    }

    public async Task<DevotionalDetailDto?> GetByIdAsync(int id)
    {
        var d = await _db.Devotionals.FindAsync(id);
        return d is null ? null : ToDetailDto(d);
    }

    public async Task<DevotionalDetailDto?> GetTodayAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var d = await _db.Devotionals.FirstOrDefaultAsync(d => d.Date == today);
        return d is null ? null : ToDetailDto(d);
    }

    public async Task<DevotionalDetailDto> CreateAsync(CreateDevotionalDto dto)
    {
        var devotional = new Devotional
        {
            Title = dto.Title,
            Date = dto.Date,
            ScriptureReference = dto.ScriptureReference,
            ReflectionText = dto.ReflectionText,
            PrayerPrompt = dto.PrayerPrompt
        };

        _db.Devotionals.Add(devotional);
        await _db.SaveChangesAsync();

        return ToDetailDto(devotional);
    }

    public async Task<DevotionalDetailDto?> UpdateAsync(int id, UpdateDevotionalDto dto)
    {
        var devotional = await _db.Devotionals.FindAsync(id);
        if (devotional is null) return null;

        if (dto.Title is not null) devotional.Title = dto.Title;
        if (dto.Date.HasValue) devotional.Date = dto.Date.Value;
        if (dto.ScriptureReference is not null) devotional.ScriptureReference = dto.ScriptureReference;
        if (dto.ReflectionText is not null) devotional.ReflectionText = dto.ReflectionText;
        if (dto.PrayerPrompt is not null) devotional.PrayerPrompt = dto.PrayerPrompt;

        await _db.SaveChangesAsync();
        return ToDetailDto(devotional);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var devotional = await _db.Devotionals.FindAsync(id);
        if (devotional is null) return false;

        _db.Devotionals.Remove(devotional);
        await _db.SaveChangesAsync();
        return true;
    }

    private static DevotionalDetailDto ToDetailDto(Devotional d) =>
        new(d.Id, d.Title, d.Date, d.ScriptureReference, d.ReflectionText, d.PrayerPrompt);
}
