# 02 — Key Concepts

Before building, let's understand the fundamental ideas behind how this application works. This chapter has no code to type — just read and absorb.

---

## The Big Picture

GraceWord has two main parts that talk to each other:

```
┌─────────────────┐         HTTP         ┌─────────────────┐
│                 │  ◄──── requests ────► │                 │
│    Frontend     │                       │     Backend     │
│  (Angular app)  │  ◄──── responses ──── │   (.NET API)    │
│                 │                       │                 │
│  Runs in the    │                       │  Runs on a      │
│  user's browser │                       │  server          │
└─────────────────┘                       └────────┬────────┘
                                                   │
                                                   │ SQL queries
                                                   ▼
                                          ┌─────────────────┐
                                          │    Database      │
                                          │    (SQLite)      │
                                          └─────────────────┘
```

---

## What Is a Backend?

The **backend** is the part of the application that runs on a server (or your computer during development). It:

- **Receives requests** from the frontend (e.g., "give me Genesis chapter 1")
- **Processes** those requests (fetches data, runs business logic)
- **Sends responses** back (e.g., the JSON data containing the Bible verses)
- **Stores data** in a database (e.g., devotional entries)

Think of it as a librarian in a back room. You (the frontend) pass a note under the door saying what you want, and the librarian finds it and passes it back.

---

## What Is a Frontend?

The **frontend** is what the user sees and interacts with in their web browser. It:

- **Displays** information (Bible text, devotionals, verse of the day)
- **Handles user interaction** (clicking buttons, selecting Bible books)
- **Sends requests** to the backend when it needs data
- **Updates the screen** when new data arrives

Think of it as the library's front desk and reading room — the user-facing part.

---

## What Is an API?

**API** stands for Application Programming Interface. In our context, it is a set of URLs (called "endpoints") that the backend exposes for the frontend to call.

For example:
- `GET /api/verseoftheday` — returns today's verse
- `GET /api/bible/Genesis/1` — returns Genesis chapter 1
- `GET /api/devotionals` — returns a list of devotionals
- `POST /api/devotionals` — creates a new devotional

The word before the URL (`GET`, `POST`, `PUT`, `DELETE`) is the **HTTP method** — it tells the server what kind of action to perform:

| Method | Purpose | Analogy |
|--------|---------|---------|
| GET | Read/retrieve data | Looking up a book in the library |
| POST | Create new data | Adding a new book to the collection |
| PUT | Update existing data | Editing a book's description |
| DELETE | Remove data | Removing a book from the collection |

---

## What Is JSON?

**JSON** (JavaScript Object Notation) is the data format the backend and frontend use to communicate. It looks like this:

```json
{
  "reference": "John 3:16",
  "text": "For God so loved the world..."
}
```

It is just a structured way of writing data using curly braces `{}` for objects, square brackets `[]` for lists, and `"key": "value"` pairs.

---

## What Is a Database?

A **database** is where your application stores data permanently. Without it, all data would disappear when the server restarts.

**SQLite** is a database that stores everything in a single file on your computer. There is no separate database server to install — it is the simplest database to set up.

---

## What Is an ORM?

An **ORM** (Object-Relational Mapper) translates between your programming language and the database. Instead of writing raw SQL queries like:

```sql
SELECT * FROM Devotionals WHERE Date = '2026-03-22'
```

You write C# code like:

```csharp
db.Devotionals.FirstOrDefault(d => d.Date == today)
```

The ORM (Entity Framework Core, in our case) converts this to SQL automatically.

---

## What Are Components?

In frontend development, a **component** is a reusable piece of the user interface. Think of it like LEGO bricks:

- A **Navbar component** — the navigation bar at the top
- A **Hero component** — the large banner section on the homepage
- A **Verse Card component** — a styled card showing a Bible verse
- A **Footer component** — the bottom section of every page

You build small components and then compose them into full pages.

---

## Smart vs. Presentational Components

This project uses a common pattern to separate concerns:

- **Presentational components** (in the `components` library) — know how to **look** but not where data comes from. They receive data as inputs and display it. Example: `VerseOfTheDayCardComponent` receives verse text and renders it beautifully.

- **Smart/Container components** (in the `domain` library) — know **where data comes from** but delegate how it looks. They call the API services, manage loading states, and pass data down to presentational components. Example: `VerseOfTheDayContainerComponent` fetches the verse from the API and passes it to the card.

```
Smart Container (fetches data)
  └── Presentational Component (displays data)
```

---

## What Is Responsive Design?

**Responsive design** means making your website look good on all screen sizes:

| Breakpoint | Width | Device |
|-----------|-------|--------|
| Mobile | 375px | Phones |
| Tablet | 768px | iPads, tablets |
| Desktop | 1440px | Laptops, monitors |

The same website automatically rearranges itself depending on the screen size. For example, on desktop you might see two columns side by side, but on mobile they stack vertically.

---

## What Is an External API?

Our app uses **bible-api.com** — a free, public API that returns Bible verse data. Instead of storing the entire Bible in our database, we ask bible-api.com for verses on demand.

When a user wants to read Genesis chapter 1:
1. Frontend asks our backend: `GET /api/bible/Genesis/1`
2. Our backend asks bible-api.com: `GET https://bible-api.com/Genesis+1`
3. bible-api.com responds with the verse data
4. Our backend passes it back to the frontend
5. The frontend displays it

Our backend acts as a **proxy** — a middleman between the frontend and the external API. This is useful because the backend can add caching, error handling, and keep the external API URL hidden from the user.

---

## Summary of Architecture

```
User's Browser
  └── Angular App (Frontend)
        ├── Pages (Home, Bible Reader, Devotionals)
        ├── Domain Containers (fetch data, manage state)
        ├── Presentational Components (display data)
        └── API Services (send HTTP requests)
              │
              ▼
        ASP.NET Core API (Backend)
        ├── Controllers (define URL endpoints)
        ├── Services (business logic)
        ├── Models (data shape definitions)
        └── Database Context (talks to SQLite)
              │
              ▼
        SQLite Database (stores devotionals, cached verses)
        bible-api.com (external Bible data)
```

---

[<<< Back to Prerequisites](01-prerequisites.md) | [Next: Backend Project Setup >>>](03-backend-project-setup.md)
