# Timilehin

Timilehin is a scripture-focused project built around a .NET Web API, an Angular workspace, and product/design documentation. The backend serves Bible chapters, a cached verse of the day, and devotional content; the frontend workspace currently contains reusable Angular libraries that are intended to power a future UI.

## Overview

The repository currently includes:

- A REST API in ASP.NET Core for Bible reading and devotionals
- SQLite-backed persistence for devotionals and daily verse caching
- An Angular workspace with an API client library and a component library
- xUnit integration tests covering the API behavior
- Product requirements and a UI prototype under `docs/`

## Current Status

- The API is implemented and testable today
- The Angular workspace is present, but it does not yet include a finished browser app
- The `components` library is still scaffold-level and intended to evolve with the UI work

## Features

### API

- Retrieve a Bible chapter by book and chapter number
- Return a verse of the day from a curated rotation, cached once per day in SQLite
- Fall back gracefully if the external Bible API is unavailable
- Create, read, update, delete, and paginate devotionals
- Fetch today's devotional by date
- Expose an OpenAPI document in development

### Frontend Workspace

- `api` Angular library with typed services for the REST API
- `components` Angular library for shared UI building blocks

## Tech Stack

- ASP.NET Core targeting `.NET 11` preview
- Entity Framework Core with SQLite
- xUnit and `WebApplicationFactory` for API tests
- Angular 21 workspace with library packaging via `ng-packagr`
- External scripture data from `bible-api.com`

## Repository Layout

```text
.
|-- docs/
|   |-- specs/
|   |   |-- L1.md
|   |   `-- L2.md
|   `-- ui-design.pen
|-- src/
|   |-- Timilehin.Api/
|   `-- Timilehin.Web/
|-- tests/
|   `-- Timilehin.Api.Tests/
|-- CONTRIBUTING.md
|-- LICENSE
|-- README.md
`-- Timilehin.slnx
```

## Quick Start

### Prerequisites

- [.NET 11 SDK preview](https://dotnet.microsoft.com/download)
- Node.js and npm

### Run the API

```bash
dotnet restore Timilehin.slnx
dotnet run --project src/Timilehin.Api
```

Notes:

- The SQLite database is created automatically on startup using `ConnectionStrings:DefaultConnection`
- CORS origins come from `src/Timilehin.Api/appsettings.json`
- Default development URLs are `http://localhost:5256` and `https://localhost:7264`
- In development, the OpenAPI document is available at `/openapi/v1.json`

### Run API tests

```bash
dotnet test Timilehin.slnx
```

### Build the Angular libraries

```bash
cd src/Timilehin.Web
npm install
npx ng build api
npx ng build components
```

Optional library tests:

```bash
cd src/Timilehin.Web
npx ng test api --watch=false
npx ng test components --watch=false
```

## API Surface

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/bible/{book}/{chapter}` | Get a Bible chapter |
| `GET` | `/api/verseoftheday` | Get the verse of the day |
| `GET` | `/api/devotionals?page=1&pageSize=10` | List devotionals with pagination |
| `GET` | `/api/devotionals/{id}` | Get a devotional by id |
| `GET` | `/api/devotionals/today` | Get today's devotional |
| `POST` | `/api/devotionals` | Create a devotional |
| `PUT` | `/api/devotionals/{id}` | Partially update a devotional |
| `DELETE` | `/api/devotionals/{id}` | Delete a devotional |

Example requests:

```bash
curl https://localhost:7264/api/verseoftheday
curl "https://localhost:7264/api/bible/Genesis/1"
```

## Configuration

Key settings live in `src/Timilehin.Api/appsettings.json`:

- `ConnectionStrings:DefaultConnection` configures the SQLite database
- `Cors:Origins` lists allowed frontend origins

The default checked-in origins are:

- `http://localhost:3000`
- `http://localhost:5173`

## Documentation

- [High-level requirements](docs/specs/L1.md)
- [Detailed requirements and acceptance criteria](docs/specs/L2.md)
- [UI design prototype](docs/ui-design.pen)
- [API scratch file for local requests](src/Timilehin.Api/Timilehin.Api.http)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

This project is licensed under the [MIT License](LICENSE).
