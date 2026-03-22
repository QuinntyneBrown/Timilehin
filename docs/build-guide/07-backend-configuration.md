# 07 — Backend Configuration & Running

In this chapter, you will finalize the backend configuration, understand CORS, and run the API for the first time.

---

## Step 1: Complete Program.cs

By now you have created models, services, and controllers. Here is the final, complete `Program.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Timilehin.Api.Data;
using Timilehin.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Services
builder.Services.AddHttpClient<IBibleService, BibleApiService>();
builder.Services.AddScoped<IDevotionalService, DevotionalService>();

// CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
            builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
            ?? ["http://localhost:3000"])
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// Auto-create database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthorization();
app.MapControllers();

app.Run();
```

---

## Step 2: Understanding CORS

**CORS** (Cross-Origin Resource Sharing) is a browser security feature. By default, a webpage at `http://localhost:4200` (the Angular app) cannot make requests to `http://localhost:5256` (the API) because they are different "origins."

Our CORS configuration tells the API: "It is okay for these specific origins to call my endpoints."

```csharp
policy.WithOrigins(/* allowed origins */)
      .AllowAnyHeader()   // Allow all HTTP headers
      .AllowAnyMethod();  // Allow GET, POST, PUT, DELETE, etc.
```

The allowed origins come from `appsettings.json`:

```json
"Cors": {
    "Origins": ["http://localhost:3000", "http://localhost:4200"]
}
```

> **Why two origins?** `localhost:4200` is where Angular runs during development. `localhost:3000` is included as a fallback/alternative. In production, you would change these to your real domain.

---

## Step 3: Understanding appsettings.json

This file holds all the configuration for the backend. The complete version:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=graceword.db"
  },
  "Cors": {
    "Origins": [
      "http://localhost:3000",
      "http://localhost:4200"
    ]
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

| Setting | Purpose |
|---------|---------|
| `ConnectionStrings:DefaultConnection` | Where the SQLite database file is stored |
| `Cors:Origins` | Which frontend URLs can call this API |
| `Logging:LogLevel` | How verbose the console output is |
| `AllowedHosts` | Which hostnames the server accepts (`*` = any) |

---

## Step 4: Understanding OpenAPI

```csharp
builder.Services.AddOpenApi();

// and later...

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
```

**OpenAPI** (formerly known as Swagger) generates documentation for your API. When running in development mode, you can visit `/openapi/v1.json` to see a machine-readable description of all your endpoints.

This is only enabled in development mode for security — you do not want to expose your API documentation in production.

---

## Step 5: Understanding the Middleware Pipeline

The order of `app.Use*()` and `app.Map*()` calls matters. Each request passes through these steps in order:

```
Request arrives
    │
    ▼
app.UseHttpsRedirection()   → Redirects HTTP to HTTPS
    │
    ▼
app.UseCors()                → Checks if the request origin is allowed
    │
    ▼
app.UseAuthorization()       → Checks permissions (not used yet, but good practice)
    │
    ▼
app.MapControllers()         → Finds the right controller and runs it
    │
    ▼
Response sent back
```

---

## Step 6: Run the Backend

From the project root:

```bash
dotnet run --project src/Timilehin.Api
```

You should see output like:

```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5256
info: Microsoft.Hosting.Lifetime[0]
      Application started.
```

---

## Step 7: Test the API

While the server is running, open a **new** terminal and test:

```bash
curl http://localhost:5256/api/verseoftheday
```

You should get a JSON response like:

```json
{
  "reference": "Psalm 23:1-6",
  "text": "The LORD is my shepherd; I shall not want..."
}
```

Try fetching a Bible chapter:

```bash
curl "http://localhost:5256/api/bible/Genesis/1"
```

Create a devotional:

```bash
curl -X POST http://localhost:5256/api/devotionals \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Walking in Faith",
    "date": "2026-03-22",
    "scriptureReference": "Hebrews 11:1",
    "reflectionText": "Faith is the substance of things hoped for...",
    "prayerPrompt": "Lord, increase my faith today."
  }'
```

List devotionals:

```bash
curl http://localhost:5256/api/devotionals
```

> **Congratulations!** Your backend is fully functional. You have a working REST API with database persistence, external API integration, and CRUD operations.

---

## Step 8: Create the Test Project (Optional)

For automated testing:

```bash
dotnet new xunit -n Timilehin.Api.Tests -o tests/Timilehin.Api.Tests
dotnet sln Timilehin.slnx add tests/Timilehin.Api.Tests
cd tests/Timilehin.Api.Tests
dotnet add reference ../../src/Timilehin.Api
dotnet add package Microsoft.AspNetCore.Mvc.Testing
cd ../..
```

Run tests with:

```bash
dotnet test Timilehin.slnx
```

---

## Alternative Stack: Running the API

### Python (Flask)
```bash
cd graceword-api
source venv/bin/activate
python app.py
# Server runs on http://localhost:5256
```

### Node.js (Express)
```bash
cd graceword-api
node server.js
# Server runs on http://localhost:5256
```

### Java (Spring Boot)
```bash
cd graceword-api
./mvnw spring-boot:run
# Server runs on http://localhost:8080 by default
```

---

## Backend Recap

You have built:

| File | Purpose |
|------|---------|
| `Program.cs` | Application entry point and configuration |
| `Models/Devotional.cs` | Devotional data shape |
| `Models/VerseOfTheDay.cs` | Verse cache data shape |
| `Data/AppDbContext.cs` | Database connection and table definitions |
| `DTOs/*.cs` | Data transfer shapes for the API |
| `Services/IBibleService.cs` | Bible service interface |
| `Services/BibleApiService.cs` | Bible API implementation (calls bible-api.com) |
| `Services/IDevotionalService.cs` | Devotional service interface |
| `Services/DevotionalService.cs` | Devotional CRUD implementation |
| `Controllers/VerseOfTheDayController.cs` | GET /api/verseoftheday |
| `Controllers/BibleController.cs` | GET /api/bible/{book}/{chapter} |
| `Controllers/DevotionalsController.cs` | Full CRUD for /api/devotionals |
| `appsettings.json` | Database and CORS configuration |

---

[<<< Back to Backend Endpoints](06-backend-controllers.md) | [Next: Frontend Project Setup >>>](08-frontend-project-setup.md)
