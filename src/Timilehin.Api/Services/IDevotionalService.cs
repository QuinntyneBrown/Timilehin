using Timilehin.Api.DTOs;

namespace Timilehin.Api.Services;

public interface IDevotionalService
{
    Task<PaginatedResult<DevotionalSummaryDto>> GetAllAsync(int page, int pageSize);
    Task<DevotionalDetailDto?> GetByIdAsync(int id);
    Task<DevotionalDetailDto?> GetTodayAsync();
    Task<DevotionalDetailDto> CreateAsync(CreateDevotionalDto dto);
    Task<DevotionalDetailDto?> UpdateAsync(int id, UpdateDevotionalDto dto);
    Task<bool> DeleteAsync(int id);
}
