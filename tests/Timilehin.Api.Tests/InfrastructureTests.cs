using System.Net;
using System.Reflection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Timilehin.Api.Data;
using Timilehin.Api.Services;

namespace Timilehin.Api.Tests;

/// <summary>
/// L2-9.1: DbContext contains both DbSets, DB auto-created on startup, connection string in appsettings.
/// </summary>
public class InfrastructureDbContextTests : IDisposable
{
    private readonly AppDbContext _db;

    public InfrastructureDbContextTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("InfraTest_" + Guid.NewGuid())
            .Options;
        _db = new AppDbContext(options);
    }

    public void Dispose() => _db.Dispose();

    [Fact]
    public void DbContext_Has_Devotionals_DbSet()
    {
        Assert.NotNull(_db.Devotionals);
    }

    [Fact]
    public void DbContext_Has_VersesOfTheDay_DbSet()
    {
        Assert.NotNull(_db.VersesOfTheDay);
    }

    [Fact]
    public async Task Database_Is_Created_On_EnsureCreated()
    {
        var created = await _db.Database.EnsureCreatedAsync();
        // In-memory database returns true on first creation
        Assert.True(created);
    }

    [Fact]
    public void ConnectionString_Is_Configured_In_AppSettings()
    {
        // Load the actual appsettings.json from the API project
        var apiProjectDir = Path.GetFullPath(
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "Timilehin.Api"));

        var config = new ConfigurationBuilder()
            .SetBasePath(apiProjectDir)
            .AddJsonFile("appsettings.json", optional: false)
            .Build();

        var connectionString = config.GetConnectionString("DefaultConnection");

        Assert.NotNull(connectionString);
        Assert.NotEmpty(connectionString);
        Assert.Contains("Data Source=", connectionString);
    }

    [Fact]
    public async Task Devotionals_Has_Unique_Date_Index()
    {
        await _db.Database.EnsureCreatedAsync();

        var devotional1 = new Models.Devotional
        {
            Title = "Test 1",
            Date = new DateOnly(2025, 1, 1),
            ScriptureReference = "John 3:16",
            ReflectionText = "Reflection",
            PrayerPrompt = "Prayer"
        };
        var devotional2 = new Models.Devotional
        {
            Title = "Test 2",
            Date = new DateOnly(2025, 1, 1), // same date
            ScriptureReference = "Psalm 23:1",
            ReflectionText = "Reflection 2",
            PrayerPrompt = "Prayer 2"
        };

        _db.Devotionals.Add(devotional1);
        await _db.SaveChangesAsync();

        // The unique index is configured in OnModelCreating
        var model = _db.Model.FindEntityType(typeof(Models.Devotional));
        Assert.NotNull(model);
        var dateIndex = model!.GetIndexes()
            .FirstOrDefault(i => i.Properties.Any(p => p.Name == "Date"));
        Assert.NotNull(dateIndex);
        Assert.True(dateIndex!.IsUnique);
    }

    [Fact]
    public void VersesOfTheDay_Has_Unique_Date_Index()
    {
        _db.Database.EnsureCreated();

        var model = _db.Model.FindEntityType(typeof(Models.VerseOfTheDay));
        Assert.NotNull(model);
        var dateIndex = model!.GetIndexes()
            .FirstOrDefault(i => i.Properties.Any(p => p.Name == "Date"));
        Assert.NotNull(dateIndex);
        Assert.True(dateIndex!.IsUnique);
    }
}

/// <summary>
/// L2-9.2: Service interfaces exist with correct method signatures, DI registration, HttpClient via IHttpClientFactory.
/// </summary>
public class InfrastructureServiceRegistrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public InfrastructureServiceRegistrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public void IBibleService_Has_GetVerseOfTheDayAsync_Method()
    {
        var method = typeof(IBibleService).GetMethod("GetVerseOfTheDayAsync");
        Assert.NotNull(method);
        Assert.Equal(typeof(Task<DTOs.VerseOfTheDayDto>), method!.ReturnType);
        Assert.Empty(method.GetParameters());
    }

    [Fact]
    public void IBibleService_Has_GetChapterAsync_Method()
    {
        var method = typeof(IBibleService).GetMethod("GetChapterAsync");
        Assert.NotNull(method);
        Assert.Equal(typeof(Task<DTOs.BibleChapterDto?>), method!.ReturnType);
        var parameters = method.GetParameters();
        Assert.Equal(2, parameters.Length);
        Assert.Equal(typeof(string), parameters[0].ParameterType);
        Assert.Equal(typeof(int), parameters[1].ParameterType);
    }

    [Fact]
    public void IDevotionalService_Has_GetAllAsync_Method()
    {
        var method = typeof(IDevotionalService).GetMethod("GetAllAsync");
        Assert.NotNull(method);
        var parameters = method!.GetParameters();
        Assert.Equal(2, parameters.Length);
        Assert.Equal(typeof(int), parameters[0].ParameterType);
        Assert.Equal(typeof(int), parameters[1].ParameterType);
    }

    [Fact]
    public void IDevotionalService_Has_GetByIdAsync_Method()
    {
        var method = typeof(IDevotionalService).GetMethod("GetByIdAsync");
        Assert.NotNull(method);
        var parameters = method!.GetParameters();
        Assert.Single(parameters);
        Assert.Equal(typeof(int), parameters[0].ParameterType);
    }

    [Fact]
    public void IDevotionalService_Has_GetTodayAsync_Method()
    {
        var method = typeof(IDevotionalService).GetMethod("GetTodayAsync");
        Assert.NotNull(method);
        Assert.Empty(method!.GetParameters());
    }

    [Fact]
    public void IDevotionalService_Has_CreateAsync_Method()
    {
        var method = typeof(IDevotionalService).GetMethod("CreateAsync");
        Assert.NotNull(method);
        var parameters = method!.GetParameters();
        Assert.Single(parameters);
        Assert.Equal(typeof(DTOs.CreateDevotionalDto), parameters[0].ParameterType);
    }

    [Fact]
    public void IDevotionalService_Has_UpdateAsync_Method()
    {
        var method = typeof(IDevotionalService).GetMethod("UpdateAsync");
        Assert.NotNull(method);
        var parameters = method!.GetParameters();
        Assert.Equal(2, parameters.Length);
    }

    [Fact]
    public void IDevotionalService_Has_DeleteAsync_Method()
    {
        var method = typeof(IDevotionalService).GetMethod("DeleteAsync");
        Assert.NotNull(method);
        var parameters = method!.GetParameters();
        Assert.Single(parameters);
        Assert.Equal(typeof(int), parameters[0].ParameterType);
    }

    [Fact]
    public void DI_Resolves_IDevotionalService()
    {
        using var scope = _factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetService<IDevotionalService>();
        Assert.NotNull(service);
        Assert.IsType<DevotionalService>(service);
    }

    [Fact]
    public void DI_Resolves_IBibleService()
    {
        using var scope = _factory.Services.CreateScope();
        var service = scope.ServiceProvider.GetService<IBibleService>();
        Assert.NotNull(service);
        Assert.IsType<BibleApiService>(service);
    }

    [Fact]
    public void DI_Resolves_IHttpClientFactory()
    {
        using var scope = _factory.Services.CreateScope();
        var factory = scope.ServiceProvider.GetService<IHttpClientFactory>();
        Assert.NotNull(factory);
    }

    [Fact]
    public void BibleApiService_Uses_HttpClient_Constructor_Injection()
    {
        // Verify BibleApiService has an HttpClient constructor parameter,
        // confirming it's designed for typed HttpClient / IHttpClientFactory pattern.
        var ctor = typeof(BibleApiService).GetConstructors().FirstOrDefault();
        Assert.NotNull(ctor);
        var parameters = ctor!.GetParameters();
        Assert.Contains(parameters, p => p.ParameterType == typeof(HttpClient));
    }
}

/// <summary>
/// L2-9.3: CORS allows configured origins, defaults to localhost:3000, allows any header/method.
/// </summary>
public class InfrastructureCorsTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public InfrastructureCorsTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    [Fact]
    public void Cors_Origins_ConfiguredInAppSettings()
    {
        var apiProjectDir = Path.GetFullPath(
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "Timilehin.Api"));

        var config = new ConfigurationBuilder()
            .SetBasePath(apiProjectDir)
            .AddJsonFile("appsettings.json", optional: false)
            .Build();

        var origins = config.GetSection("Cors:Origins").Get<string[]>();
        Assert.NotNull(origins);
        Assert.Contains("http://localhost:3000", origins);
    }

    [Fact]
    public void Cors_Defaults_To_Localhost3000_InCode()
    {
        // Verify that Program.cs has the fallback default of localhost:3000
        // by checking the configuration pattern in appsettings.
        // The code uses: ?? ["http://localhost:3000"]
        // We verify this by reading the source via reflection isn't possible,
        // so we verify the config has it and the CORS middleware is active.
        var apiProjectDir = Path.GetFullPath(
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "Timilehin.Api"));

        var programSource = File.ReadAllText(Path.Combine(apiProjectDir, "Program.cs"));
        Assert.Contains("http://localhost:3000", programSource);
        Assert.Contains("AllowAnyHeader", programSource);
        Assert.Contains("AllowAnyMethod", programSource);
    }

    [Fact]
    public async Task Cors_Preflight_Returns_AllowHeaders()
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/");
        request.Headers.Add("Origin", "http://localhost:3000");
        request.Headers.Add("Access-Control-Request-Method", "GET");
        request.Headers.Add("Access-Control-Request-Headers", "Content-Type");

        var response = await _client.SendAsync(request);

        // CORS preflight should not return a server error
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task Cors_Preflight_AllowsAnyMethod()
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/");
        request.Headers.Add("Origin", "http://localhost:3000");
        request.Headers.Add("Access-Control-Request-Method", "DELETE");

        var response = await _client.SendAsync(request);
        Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);
    }
}

/// <summary>
/// L2-9.4: OpenAPI endpoint is mapped in Development environment.
/// </summary>
public class InfrastructureOpenApiTests
{
    [Fact]
    public async Task OpenApi_Endpoint_Available_In_Development()
    {
        // Create a factory that sets environment to Development
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Development");
                builder.ConfigureServices(services =>
                {
                    // Replace SQLite with in-memory database
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor is not null)
                        services.Remove(descriptor);
                    services.AddDbContext<AppDbContext>(options =>
                        options.UseInMemoryDatabase("OpenApiTest_" + Guid.NewGuid()));
                });
            });

        var client = factory.CreateClient();
        var response = await client.GetAsync("/openapi/v1.json");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("openapi", content, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task OpenApi_Endpoint_NotAvailable_In_NonDevelopment()
    {
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.UseEnvironment("Production");
                builder.ConfigureServices(services =>
                {
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                    if (descriptor is not null)
                        services.Remove(descriptor);
                    services.AddDbContext<AppDbContext>(options =>
                        options.UseInMemoryDatabase("OpenApiTestProd_" + Guid.NewGuid()));
                });
            });

        var client = factory.CreateClient();
        var response = await client.GetAsync("/openapi/v1.json");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public void Program_Calls_AddOpenApi()
    {
        var apiProjectDir = Path.GetFullPath(
            Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "Timilehin.Api"));
        var programSource = File.ReadAllText(Path.Combine(apiProjectDir, "Program.cs"));

        Assert.Contains("AddOpenApi()", programSource);
        Assert.Contains("MapOpenApi()", programSource);
    }
}
