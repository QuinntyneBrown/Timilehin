# 03 — Backend Project Setup

In this chapter, you will create the .NET project that serves as the backend API. By the end, you will have a running (empty) web server.

---

## Step 1: Create the Solution and API Project

A **solution** (`.slnx` file) is a container that groups related projects together. An **API project** is the actual code.

Open your terminal in the `GraceWord` folder and run:

```bash
dotnet new webapi -n Timilehin.Api -o src/Timilehin.Api --no-openapi
```

**What this does:**
- `dotnet new webapi` — creates a new Web API project from a template
- `-n Timilehin.Api` — names the project "Timilehin.Api"
- `-o src/Timilehin.Api` — puts it inside a `src/Timilehin.Api` folder
- `--no-openapi` — we will add OpenAPI ourselves later

Now create the solution file and add the project to it:

```bash
dotnet new slnx -n Timilehin
dotnet sln Timilehin.slnx add src/Timilehin.Api
```

---

## Step 2: Add Required NuGet Packages

**NuGet packages** are pre-built libraries that add functionality. We need packages for SQLite and Entity Framework Core.

```bash
cd src/Timilehin.Api
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design
cd ../..
```

**What these do:**
- `EntityFrameworkCore.Sqlite` — lets Entity Framework talk to a SQLite database
- `EntityFrameworkCore.Design` — tools for database management during development

---

## Step 3: Create the Folder Structure

Inside `src/Timilehin.Api`, create these folders:

```bash
mkdir -p src/Timilehin.Api/Models
mkdir -p src/Timilehin.Api/Data
mkdir -p src/Timilehin.Api/Services
mkdir -p src/Timilehin.Api/Controllers
mkdir -p src/Timilehin.Api/DTOs
```

**What each folder is for:**

| Folder | Purpose |
|--------|---------|
| `Models` | Data classes that represent database tables |
| `Data` | Database context (the connection to SQLite) |
| `Services` | Business logic (fetching verses, managing devotionals) |
| `Controllers` | API endpoints (the URLs the frontend calls) |
| `DTOs` | Data Transfer Objects (shapes of data sent to/from the API) |

Your project structure now looks like:

```
GraceWord/
├── src/
│   └── Timilehin.Api/
│       ├── Controllers/
│       ├── Data/
│       ├── DTOs/
│       ├── Models/
│       ├── Services/
│       ├── Program.cs          ← the main entry point
│       ├── appsettings.json    ← configuration
│       └── Timilehin.Api.csproj
└── Timilehin.slnx
```

---

## Step 4: Verify the Project Runs

```bash
dotnet build Timilehin.slnx
```

If this prints "Build succeeded," you are ready to move on.

---

## Understanding Program.cs

Open `src/Timilehin.Api/Program.cs` in your editor. The template created a basic file. By the end of this guide, it will look like this:

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

**Do not type this yet** — we will build it up piece by piece in the following chapters. This is just a preview so you know where we are heading.

**Line-by-line explanation:**

| Lines | What It Does |
|-------|-------------|
| `var builder = ...` | Creates the application builder — like laying the foundation |
| `AddDbContext` | Registers the database connection |
| `AddHttpClient` | Registers the Bible API service with an HTTP client for making web requests |
| `AddScoped` | Registers the Devotional service (created fresh for each request) |
| `AddCors` | Configures which websites can call this API |
| `AddControllers` | Enables API controllers (the URL endpoints) |
| `AddOpenApi` | Enables API documentation |
| `EnsureCreatedAsync` | Creates the database tables if they do not exist |
| `app.UseCors()` | Activates the CORS policy |
| `app.MapControllers()` | Maps the controller routes |
| `app.Run()` | Starts the server |

---

## Alternative Stack: Python (Flask)

If you were building this in Python with Flask, the equivalent setup would be:

```bash
mkdir graceword-api
cd graceword-api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install flask flask-cors flask-sqlalchemy requests
```

Your folder structure:

```
graceword-api/
├── app/
│   ├── __init__.py
│   ├── models.py
│   ├── routes/
│   │   ├── bible.py
│   │   └── devotionals.py
│   └── services/
│       ├── bible_service.py
│       └── devotional_service.py
├── app.py
└── requirements.txt
```

The Flask equivalent of `Program.cs`:

```python
# app.py
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///graceword.db'

    CORS(app, origins=["http://localhost:3000"])
    db.init_app(app)

    from app.routes.bible import bible_bp
    from app.routes.devotionals import devotionals_bp
    app.register_blueprint(bible_bp, url_prefix='/api')
    app.register_blueprint(devotionals_bp, url_prefix='/api')

    with app.app_context():
        db.create_all()

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(port=5256, debug=True)
```

---

## Alternative Stack: Node.js (Express)

```bash
mkdir graceword-api
cd graceword-api
npm init -y
npm install express cors better-sqlite3 axios
```

The Express equivalent of `Program.cs`:

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
const db = new Database('graceword.db');

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS devotionals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL UNIQUE,
    scripture_reference TEXT NOT NULL,
    reflection_text TEXT NOT NULL,
    prayer_prompt TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS verses_of_the_day (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    reference TEXT NOT NULL,
    text TEXT NOT NULL
  );
`);

// Routes will be added here

app.listen(5256, () => console.log('Server running on port 5256'));
```

---

## Alternative Stack: Java (Spring Boot)

```bash
# Use Spring Initializr at https://start.spring.io
# Select: Maven, Java 21, Spring Boot 3.x
# Dependencies: Spring Web, Spring Data JPA, SQLite JDBC
```

The Spring Boot equivalent structure:

```
src/main/java/com/graceword/api/
├── GraceWordApplication.java
├── model/
│   ├── Devotional.java
│   └── VerseOfTheDay.java
├── repository/
│   ├── DevotionalRepository.java
│   └── VerseOfTheDayRepository.java
├── service/
│   ├── BibleService.java
│   └── DevotionalService.java
└── controller/
    ├── BibleController.java
    └── DevotionalsController.java
```

---

[<<< Back to Key Concepts](02-concepts.md) | [Next: Database & Models >>>](04-database-and-models.md)
