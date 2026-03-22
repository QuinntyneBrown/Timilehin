# Timilehin

A REST API for Bible reading and daily devotionals, built with ASP.NET Core and Entity Framework Core.

## Features

- **Bible Reading** — Retrieve Bible chapters by book and chapter number
- **Verse of the Day** — Get a daily verse
- **Devotionals** — Full CRUD for devotional entries, with a "today's devotional" endpoint and paginated listing

## Tech Stack

- .NET 11 / ASP.NET Core
- Entity Framework Core with SQLite
- OpenAPI (Swagger) support in development

## Getting Started

### Prerequisites

- [.NET 11 SDK](https://dotnet.microsoft.com/download)

### Run locally

```bash
cd src/Timilehin.Api
dotnet run
```

The API starts at `https://localhost:5001` (or the port configured in `Properties/launchSettings.json`). The SQLite database is created automatically on first startup.

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/bible/{book}/{chapter}` | Get a Bible chapter |
| GET | `/api/verseoftheday` | Get the verse of the day |
| GET | `/api/devotionals?page=1&pageSize=10` | List devotionals (paginated) |
| GET | `/api/devotionals/{id}` | Get a devotional by ID |
| GET | `/api/devotionals/today` | Get today's devotional |
| POST | `/api/devotionals` | Create a devotional |
| PUT | `/api/devotionals/{id}` | Update a devotional |
| DELETE | `/api/devotionals/{id}` | Delete a devotional |

## Project Structure

```
src/
└── Timilehin.Api/
    ├── Controllers/    # API endpoints
    ├── Data/           # EF Core DbContext
    ├── DTOs/           # Request/response models
    ├── Models/         # Entity models
    └── Services/       # Business logic
```

## License

This project is unlicensed. All rights reserved.
