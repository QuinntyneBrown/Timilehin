# 08 — Frontend Project Setup

In this chapter, you will create the Angular workspace and its library structure. By the end, you will have a project skeleton ready for building the user interface.

---

## What Is Angular?

**Angular** is a framework for building web applications. It lets you create **components** (reusable pieces of UI) and compose them into full pages. Angular is built on TypeScript, a typed version of JavaScript.

---

## What Is a Workspace with Libraries?

Instead of putting all frontend code in one big folder, this project uses **libraries** to organize code by responsibility:

| Library | Purpose | Analogy |
|---------|---------|---------|
| `api` | HTTP services and data models | The phone that calls the backend |
| `components` | Presentational UI building blocks | LEGO bricks |
| `domain` | Smart containers that wire data to UI | The instructions for assembling the LEGO bricks |
| `timilehin` | The actual application with pages and routing | The finished LEGO creation |

This separation means the `components` library knows nothing about where data comes from, and the `api` library knows nothing about how data is displayed.

---

## Step 1: Create the Angular Workspace

From the project root (`GraceWord/`):

```bash
cd src
npx @angular/cli new Timilehin.Web --no-create-application --skip-git
cd Timilehin.Web
```

**What this does:**
- `new Timilehin.Web` — creates a new Angular workspace named Timilehin.Web
- `--no-create-application` — creates just the workspace, no app yet (we will add it separately)
- `--skip-git` — does not initialize a new Git repo (we already have one at the root)

---

## Step 2: Create the Libraries

```bash
npx ng generate library api
npx ng generate library components
npx ng generate library domain
```

Each command creates a library under `projects/`:
- `projects/api/` — for API services
- `projects/components/` — for presentational components
- `projects/domain/` — for smart containers

---

## Step 3: Create the Application

```bash
npx ng generate application timilehin --style=scss --routing
```

This creates the browser application at `projects/timilehin/` with:
- SCSS styling (a more powerful version of CSS)
- Routing enabled (navigation between pages)

---

## Step 4: Install Dependencies

```bash
npm install
```

This downloads all the required packages listed in `package.json`.

---

## Step 5: Set Up the Development Proxy

The Angular dev server runs on `http://localhost:4200`, but the API runs on `http://localhost:5256`. We need a **proxy** to forward API calls.

Create `projects/timilehin/src/proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:5256",
    "secure": false,
    "changeOrigin": true
  }
}
```

**What this does:** When the frontend makes a request to `/api/verseoftheday`, the dev server forwards it to `http://localhost:5256/api/verseoftheday`. The frontend does not need to know the backend's actual address.

Then update `angular.json` to use the proxy. Find the `serve` configuration for the `timilehin` project and add:

```json
"proxyConfig": "projects/timilehin/src/proxy.conf.json"
```

---

## Step 6: Understand the Project Structure

After setup, your workspace looks like:

```
src/Timilehin.Web/
├── projects/
│   ├── api/
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── models/       ← TypeScript data types
│   │       │   └── services/     ← HTTP service classes
│   │       └── public-api.ts     ← what this library exports
│   ├── components/
│   │   └── src/
│   │       ├── lib/              ← all presentational components
│   │       └── public-api.ts
│   ├── domain/
│   │   └── src/
│   │       ├── lib/              ← smart container components
│   │       └── public-api.ts
│   └── timilehin/
│       └── src/
│           ├── app/
│           │   ├── app.config.ts ← app configuration
│           │   ├── app.routes.ts ← page routing
│           │   └── pages/        ← page components
│           ├── styles.scss        ← global styles
│           └── index.html
├── angular.json                   ← workspace configuration
└── package.json                   ← dependencies
```

---

## Step 7: Build Libraries in Order

Libraries depend on each other, so they must be built in order:

```bash
npx ng build api
npx ng build components
npx ng build domain
```

- `api` has no dependencies on other libraries
- `components` has no dependencies on other libraries
- `domain` depends on both `api` and `components`

---

## Step 8: Verify

Start the Angular dev server:

```bash
npx ng serve timilehin
```

Open `http://localhost:4200` in your browser. You should see the default Angular welcome page.

Press `Ctrl+C` in the terminal to stop the server.

---

## Understanding angular.json

The `angular.json` file is the master configuration for the workspace. It defines:

- Which projects exist (api, components, domain, timilehin)
- How to build each project
- Where output files go
- Dev server settings (port, proxy, etc.)

You rarely edit this file directly — the Angular CLI commands update it for you.

---

## Understanding public-api.ts

Each library has a `public-api.ts` file that controls what is **exported** (made available to other libraries). Think of it as a menu — only items on the menu can be ordered by other parts of the application.

```typescript
// projects/api/src/public-api.ts
export * from './lib/models';
export * from './lib/services';
```

This means other libraries can import models and services from `api`, but not internal implementation details.

---

## Alternative Stack: React

If you prefer React instead of Angular:

```bash
npx create-react-app graceword-web --template typescript
cd graceword-web
npm install axios react-router-dom
```

Folder structure:

```
graceword-web/src/
├── api/
│   ├── models.ts
│   ├── bibleService.ts
│   └── devotionalService.ts
├── components/
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── VerseCard.tsx
│   └── ...
├── pages/
│   ├── HomePage.tsx
│   ├── BibleReaderPage.tsx
│   └── DevotionalsPage.tsx
├── App.tsx
└── index.tsx
```

## Alternative Stack: Vue

```bash
npm create vue@latest graceword-web
cd graceword-web
npm install axios vue-router
```

## Alternative Stack: Svelte

```bash
npx sv create graceword-web
cd graceword-web
npm install
```

All frontend frameworks follow the same basic pattern:
1. Define data types/models
2. Create API service functions
3. Build presentational UI components
4. Compose pages from components
5. Set up routing between pages

---

[<<< Back to Backend Configuration](07-backend-configuration.md) | [Next: Frontend API Library >>>](09-frontend-api-library.md)
