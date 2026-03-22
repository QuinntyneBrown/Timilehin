# 12 — Frontend App & Routing

In this chapter, you will wire everything together: pages, navigation, routing, and global styles. By the end, you will have a complete, navigable frontend application.

---

## What Is Routing?

**Routing** maps URLs to pages:
- `/` shows the Homepage
- `/bible` shows the Bible Reader
- `/devotionals` shows the Devotionals page

When you click a navigation link, Angular changes the URL and swaps the displayed page *without* reloading the entire browser page. This creates a smooth, fast experience.

---

## Step 1: App Configuration

Edit `projects/timilehin/src/app/app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
};
```

**What each provider does:**
- `provideRouter(routes)` — enables page navigation
- `provideHttpClient()` — enables HTTP requests (used by the `api` library)

---

## Step 2: Define Routes

Edit `projects/timilehin/src/app/app.routes.ts`:

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home-page').then(m => m.HomePageComponent)
  },
  {
    path: 'bible',
    loadComponent: () =>
      import('./pages/bible-page').then(m => m.BiblePageComponent)
  },
  {
    path: 'devotionals',
    loadComponent: () =>
      import('./pages/devotionals-page').then(m => m.DevotionalsPageComponent)
  },
  { path: '**', redirectTo: '' }
];
```

**Breaking it down:**

| Code | Meaning |
|------|---------|
| `path: ''` | The root URL (`/`) |
| `path: 'bible'` | The URL `/bible` |
| `loadComponent: () => import(...)` | **Lazy loading** — the page's code is only downloaded when the user navigates to it, making the initial page load faster |
| `path: '**'` | Any URL that does not match the above — redirects to home |

---

## Step 3: Create Page Components

Pages are thin wrappers that render domain containers and handle navigation events.

Create folder and file `projects/timilehin/src/app/pages/home-page.ts`:

```typescript
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HomepageContainerComponent } from 'domain';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [HomepageContainerComponent],
  template: `
    <lib-homepage-container (navigated)="onNavigate($event)" />
  `
})
export class HomePageComponent {
  constructor(private router: Router) {}

  onNavigate(path: string): void {
    this.router.navigate([path]);
  }
}
```

**What happens:** When the homepage container emits a `navigated` event (e.g., user clicks "Start Reading"), this page component calls `router.navigate(['/bible'])` to navigate there.

Create `projects/timilehin/src/app/pages/bible-page.ts`:

```typescript
import { Component } from '@angular/core';
import { BibleReaderContainerComponent } from 'domain';

@Component({
  selector: 'app-bible-page',
  standalone: true,
  imports: [BibleReaderContainerComponent],
  template: `<lib-bible-reader-container />`
})
export class BiblePageComponent {}
```

Create `projects/timilehin/src/app/pages/devotionals-page.ts`:

```typescript
import { Component } from '@angular/core';
import { DevotionalPageContainerComponent } from 'domain';

@Component({
  selector: 'app-devotionals-page',
  standalone: true,
  imports: [DevotionalPageContainerComponent],
  template: `<lib-devotional-page-container />`
})
export class DevotionalsPageComponent {}
```

---

## Step 4: Set Up the App Shell

The app shell is the root component that wraps every page. It contains the navbar and the router outlet.

Edit `projects/timilehin/src/app/app.component.ts` (or create it):

```typescript
import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from 'components';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  template: `
    <lib-navbar
      [links]="navLinks"
      [activePath]="currentPath"
      (linkClicked)="onLinkClicked($event)" />
    <router-outlet />
  `
})
export class AppComponent {
  navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Read Bible', path: '/bible' },
    { label: 'Devotionals', path: '/devotionals' }
  ];

  get currentPath(): string {
    return this.router.url;
  }

  constructor(private router: Router) {}

  onLinkClicked(path: string): void {
    this.router.navigate([path]);
  }
}
```

**The `<router-outlet />`** is a placeholder. Angular swaps in the correct page component based on the current URL. The navbar stays visible above it on every page.

---

## Step 5: Global Styles

Edit `projects/timilehin/src/styles.scss`:

```scss
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@400;500;600&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: #FFFAF5;
  color: #2a2a2a;
  line-height: 1.5;
}

a {
  color: inherit;
  text-decoration: none;
}
```

**What this does:**
1. **Imports Google Fonts** — Playfair Display (for headings) and Inter (for body text)
2. **Resets defaults** — removes browser default margins and padding
3. **Sets base styles** — font, background color, and text color for the entire app

**Understanding `box-sizing: border-box`:** By default, padding is added *outside* an element's width. `border-box` includes padding *inside* the width, making layouts much more predictable.

---

## Step 6: Update index.html

Edit `projects/timilehin/src/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>GraceWord</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

The `<app-root>` tag is where Angular mounts the `AppComponent`. The `<meta name="viewport">` tag is essential for responsive design — it tells mobile browsers to use the device width instead of a zoomed-out desktop view.

---

## Step 7: Build and Run

Build the libraries in order, then serve the app:

```bash
cd src/Timilehin.Web
npx ng build api
npx ng build components
npx ng build domain
npx ng serve timilehin
```

Open `http://localhost:4200` in your browser.

Make sure the backend is also running in another terminal:

```bash
dotnet run --project src/Timilehin.Api
```

---

## How Navigation Works End-to-End

```
User clicks "Read Bible" in the navbar
    │
    ▼
NavbarComponent emits linkClicked("/bible")
    │
    ▼
AppComponent calls router.navigate(["/bible"])
    │
    ▼
Angular matches path "bible" in routes
    │
    ▼
BiblePageComponent loads (lazy-loaded)
    │
    ▼
BibleReaderContainerComponent initializes
    │
    ▼
BibleService.getChapter("Genesis", 1) called
    │
    ▼
HTTP GET /api/bible/Genesis/1 (proxied to backend)
    │
    ▼
Backend calls bible-api.com and returns verse data
    │
    ▼
VerseItemComponents render each verse
    │
    ▼
User sees Genesis Chapter 1 on screen
```

---

## Alternative Stack: React (React Router)

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { BibleReaderPage } from './pages/BibleReaderPage';
import { DevotionalsPage } from './pages/DevotionalsPage';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/bible" element={<BibleReaderPage />} />
        <Route path="/devotionals" element={<DevotionalsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## Alternative Stack: Vue (Vue Router)

```typescript
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('../pages/HomePage.vue') },
    { path: '/bible', component: () => import('../pages/BibleReaderPage.vue') },
    { path: '/devotionals', component: () => import('../pages/DevotionalsPage.vue') },
  ]
});
```

```vue
<!-- src/App.vue -->
<template>
  <Navbar />
  <router-view />
</template>
```

---

[<<< Back to Domain Containers](11-frontend-domain-containers.md) | [Next: Running & Testing >>>](13-running-and-testing.md)
