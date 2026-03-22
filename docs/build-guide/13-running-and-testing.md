# 13 — Running & Testing

In this chapter, you will learn how to run the full application, test it manually, write automated tests, and troubleshoot common problems.

---

## Running the Full Application

You need **two terminals** running simultaneously:

### Terminal 1: Start the Backend

```bash
dotnet run --project src/Timilehin.Api
```

This starts the API on `http://localhost:5256`. Keep this terminal open.

### Terminal 2: Start the Frontend

```bash
cd src/Timilehin.Web
npx ng build api && npx ng build components && npx ng build domain
npx ng serve timilehin
```

This starts the Angular dev server on `http://localhost:4200`. Keep this terminal open too.

### Using the Run Script

This project includes a convenience script that does both:

```bat
eng\scripts\run-all.bat
```

---

## Manual Testing Checklist

Open `http://localhost:4200` in your browser and verify:

### Homepage
- [ ] Hero section shows "Welcome to GraceWord"
- [ ] "Start Reading" button navigates to `/bible`
- [ ] "Explore Devotionals" button navigates to `/devotionals`
- [ ] Verse of the Day section shows a verse with a reference
- [ ] Feature cards are visible
- [ ] Footer is visible at the bottom

### Bible Reader (`/bible`)
- [ ] Book list is visible in the sidebar
- [ ] Clicking a book loads chapter 1
- [ ] Verse numbers and text are displayed
- [ ] Previous/Next chapter navigation works
- [ ] Loading indicator appears while fetching

### Devotionals (`/devotionals`)
- [ ] Today's devotional displays (if one exists for today)
- [ ] "No devotional for today" message shows (if none exists)
- [ ] Archive sidebar shows past devotionals
- [ ] Clicking an archive card shows its full content

### Navigation
- [ ] Navbar links work (Home, Read Bible, Devotionals)
- [ ] Active link is highlighted
- [ ] Browser back/forward buttons work

### Responsive Design
- [ ] Open browser DevTools (F12) and toggle device toolbar
- [ ] Test at 375px (mobile) — single column, hamburger menu
- [ ] Test at 768px (tablet) — two columns where appropriate
- [ ] Test at 1440px (desktop) — full layout

---

## Automated Testing: Backend (xUnit)

### Setting Up the Test Project

```bash
dotnet new xunit -n Timilehin.Api.Tests -o tests/Timilehin.Api.Tests
dotnet sln Timilehin.slnx add tests/Timilehin.Api.Tests
cd tests/Timilehin.Api.Tests
dotnet add reference ../../src/Timilehin.Api
dotnet add package Microsoft.AspNetCore.Mvc.Testing
cd ../..
```

### Writing an Integration Test

Create `tests/Timilehin.Api.Tests/VerseOfTheDayTests.cs`:

```csharp
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Timilehin.Api.Tests;

public class VerseOfTheDayTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public VerseOfTheDayTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetVerseOfTheDay_Returns200()
    {
        var response = await _client.GetAsync("/api/verseoftheday");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetVerseOfTheDay_ReturnsReferenceAndText()
    {
        var response = await _client.GetAsync("/api/verseoftheday");
        var json = await response.Content.ReadFromJsonAsync<VerseResponse>();

        Assert.NotNull(json);
        Assert.False(string.IsNullOrEmpty(json.Reference));
        Assert.False(string.IsNullOrEmpty(json.Text));
    }

    private record VerseResponse(string Reference, string Text);
}
```

**What `WebApplicationFactory<Program>` does:** It creates a test version of your entire API, running in-memory. No real server starts — the tests make HTTP calls directly to the in-memory app. This is fast and isolated.

### Running Backend Tests

```bash
dotnet test Timilehin.slnx
```

---

## Automated Testing: Frontend (Unit Tests)

Angular comes with Karma and Jasmine for unit testing.

### Running Frontend Tests

```bash
cd src/Timilehin.Web
npx ng test api --watch=false
npx ng test components --watch=false
npx ng test domain --watch=false
```

### Example Unit Test

A test for the Verse of the Day container:

```typescript
// projects/domain/src/lib/verse-of-the-day-container/
//   verse-of-the-day-container.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { BibleService } from 'api';
import { VerseOfTheDayContainerComponent } from './verse-of-the-day-container.component';

describe('VerseOfTheDayContainerComponent', () => {
  let component: VerseOfTheDayContainerComponent;
  let fixture: ComponentFixture<VerseOfTheDayContainerComponent>;

  beforeEach(async () => {
    const mockBibleService = {
      getVerseOfTheDay: () => of({
        reference: 'John 3:16',
        text: 'For God so loved the world...'
      })
    };

    await TestBed.configureTestingModule({
      imports: [VerseOfTheDayContainerComponent],
      providers: [
        { provide: BibleService, useValue: mockBibleService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VerseOfTheDayContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load verse on init', () => {
    expect(component.verse).toBeTruthy();
    expect(component.verse?.reference).toBe('John 3:16');
    expect(component.loading).toBeFalse();
  });
});
```

**What this test does:**
1. Creates a **mock** (fake) Bible service that returns a known verse
2. Creates the component with the mock service
3. Verifies the component loaded the verse and set `loading` to false

---

## Automated Testing: End-to-End (Playwright)

Playwright tests simulate a real user interacting with the browser.

### Setting Up Playwright

```bash
cd src/Timilehin.Web
npm install -D @playwright/test
npx playwright install
```

Create `src/Timilehin.Web/playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:4200',
  },
  webServer: {
    command: 'npx ng serve timilehin',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
  },
});
```

### Writing an E2E Test

Create `src/Timilehin.Web/e2e/homepage.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Welcome to GraceWord')).toBeVisible();
  });

  test('should show verse of the day', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Verse of the Day')).toBeVisible();
  });

  test('should navigate to Bible reader', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Start Reading').click();
    await expect(page).toHaveURL('/bible');
  });

  test('should navigate to Devotionals', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Explore Devotionals').click();
    await expect(page).toHaveURL('/devotionals');
  });
});
```

### Running E2E Tests

Make sure the backend and frontend are running, then:

```bash
cd src/Timilehin.Web
npx playwright test
```

---

## Troubleshooting Common Problems

### "Connection refused" when loading data
**Cause:** The backend is not running, or the proxy is misconfigured.
**Fix:** Make sure `dotnet run --project src/Timilehin.Api` is running in another terminal. Check that `proxy.conf.json` points to the correct backend port.

### "CORS error" in browser console
**Cause:** The frontend origin is not in the backend's CORS allowed list.
**Fix:** Check `appsettings.json` includes `http://localhost:4200` in the `Cors:Origins` array.

### "Module not found" errors in Angular
**Cause:** Libraries need to be built before the app can use them.
**Fix:** Build libraries in order: `npx ng build api && npx ng build components && npx ng build domain`

### "Cannot find module 'api'" or similar
**Cause:** The library has not been built, or the TypeScript path mapping is missing.
**Fix:** Check `tsconfig.json` for path mappings to the library's `dist/` folder.

### Verse of the Day shows fallback message
**Cause:** The backend could not reach bible-api.com (network issue).
**Fix:** Check your internet connection. The app is designed to show a graceful fallback.

### Database errors on startup
**Cause:** The SQLite file might be locked or corrupted.
**Fix:** Delete the `graceword.db` file and restart the backend. `EnsureCreatedAsync()` will recreate it.

---

## Alternative Stack: Testing

### Python (pytest)
```bash
pip install pytest
pytest tests/
```

### Node.js (Jest)
```bash
npm install --save-dev jest supertest
npx jest
```

### Java (JUnit + Spring Boot Test)
```bash
./mvnw test
```

### Frontend E2E (Cypress — alternative to Playwright)
```bash
npm install -D cypress
npx cypress open
```

---

[<<< Back to Frontend App & Routing](12-frontend-app-and-routing.md) | [Next: Alternative Technology Stacks >>>](14-alternative-stacks.md)
