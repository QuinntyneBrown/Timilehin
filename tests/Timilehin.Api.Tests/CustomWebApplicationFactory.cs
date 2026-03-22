using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Timilehin.Api.Data;

namespace Timilehin.Api.Tests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    /// <summary>
    /// Optional handler to inject into the HttpClient used by BibleApiService.
    /// Set this before creating a client via CreateClient().
    /// </summary>
    public HttpMessageHandler? BibleApiHandler { get; set; }

    /// <summary>
    /// Alias for BibleApiHandler, used by VerseOfTheDayTests.
    /// </summary>
    public HttpMessageHandler? ExternalApiHandler
    {
        get => BibleApiHandler;
        set => BibleApiHandler = value;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Replace SQLite with InMemory database
            var dbDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (dbDescriptor is not null)
                services.Remove(dbDescriptor);

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase("TestDb_" + Guid.NewGuid()));

            // If a custom handler is provided, reconfigure the named HttpClient
            // used by BibleApiService (registered via AddHttpClient<IBibleService, BibleApiService>)
            if (BibleApiHandler is not null)
            {
                services.ConfigureHttpClientDefaults(clientBuilder =>
                {
                    clientBuilder.ConfigurePrimaryHttpMessageHandler(() => BibleApiHandler);
                });
            }
        });

        builder.UseEnvironment("Development");
    }
}
