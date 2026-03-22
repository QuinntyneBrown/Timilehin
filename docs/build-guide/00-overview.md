# Build Guide: GraceWord Platform

## A Step-by-Step Guide for Non-Programmers

This guide walks you through building the entire GraceWord platform from scratch. GraceWord is a scripture-focused web application where users can read the Bible, explore daily devotionals, and see a Verse of the Day.

---

## What You Will Build

By the end of this guide, you will have a fully working web application with:

1. **A Backend API** (the "server" that stores and serves data)
   - An endpoint that returns a daily Bible verse
   - An endpoint that lets users read any Bible chapter
   - Full CRUD (Create, Read, Update, Delete) for devotional content
   - A SQLite database that stores data in a simple file

2. **A Frontend Web App** (the "website" that users see and interact with)
   - A homepage with a hero banner, verse of the day, and feature cards
   - A Bible Reader page with book/chapter navigation
   - A Devotionals page with today's devotional and an archive of past entries
   - Fully responsive design for mobile, tablet, and desktop

---

## How This Guide Is Organized

| Page | Title | What You Will Learn |
|------|-------|-------------------|
| [01](01-prerequisites.md) | Prerequisites & Setup | Installing the tools you need |
| [02](02-concepts.md) | Key Concepts | Understanding backends, frontends, APIs, and databases |
| [03](03-backend-project-setup.md) | Backend Project Setup | Creating the .NET project and folder structure |
| [04](04-database-and-models.md) | Database & Models | Defining your data and setting up SQLite |
| [05](05-backend-services.md) | Backend Services | Writing business logic and connecting to the Bible API |
| [06](06-backend-controllers.md) | Backend API Endpoints | Creating the REST API routes |
| [07](07-backend-configuration.md) | Backend Configuration | CORS, settings, and running the API |
| [08](08-frontend-project-setup.md) | Frontend Project Setup | Creating the Angular workspace and libraries |
| [09](09-frontend-api-library.md) | Frontend API Library | Building typed HTTP services |
| [10](10-frontend-components.md) | Frontend Components | Building the visual building blocks |
| [11](11-frontend-domain-containers.md) | Frontend Domain Containers | Wiring data to the UI |
| [12](12-frontend-app-and-routing.md) | Frontend App & Routing | Pages, navigation, and global styles |
| [13](13-running-and-testing.md) | Running & Testing | Launching the full app and writing tests |
| [14](14-alternative-stacks.md) | Alternative Technology Stacks | Building this in Python, Node.js, Java, and more |

---

## Technology Stack Used in This Project

| Layer | Technology | What It Does |
|-------|-----------|-------------|
| Backend Language | C# | The programming language for server code |
| Backend Framework | ASP.NET Core (.NET 11) | Handles HTTP requests, routing, and middleware |
| Database | SQLite + Entity Framework Core | Stores data in a file; EF Core is the "translator" between C# and SQL |
| Frontend Language | TypeScript | A typed version of JavaScript |
| Frontend Framework | Angular 21 | Builds the interactive website with components |
| External API | bible-api.com | Provides Bible verse data for free |
| Testing | xUnit (backend), Playwright (end-to-end) | Verifies everything works correctly |

---

## What "Non-Programmer" Means Here

This guide assumes you have **zero coding experience**. Every step explains:

- **What** you are doing
- **Why** you are doing it
- **What the code means** in plain English

You will be typing commands and code, but every piece is explained before you type it.

> **Tip:** If you get stuck, re-read the explanation before the code block. The "why" is just as important as the "what."

---

## Time Commitment

This is a substantial project. Expect to spend several focused sessions working through the guide. Do not rush. Understanding each step before moving on will save you time in the long run.

---

[Next: Prerequisites & Setup >>>](01-prerequisites.md)
