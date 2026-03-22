# 11 — Frontend Domain Containers (Smart Components)

In this chapter, you will build the **domain containers** — smart components that fetch data from the API and pass it to presentational components. These are the "brains" of each page.

---

## Smart vs. Presentational Recap

| Aspect | Presentational (Chapter 10) | Smart/Container (This Chapter) |
|--------|---------------------------|-------------------------------|
| Knows about API? | No | Yes |
| Manages state? | No | Yes (loading, error, data) |
| Has inputs? | Yes (receives data) | Minimal (maybe a route param) |
| Has outputs? | Yes (emits events) | Yes (navigation events) |
| Reusable? | Highly | Page-specific |

---

## Container 1: Verse of the Day

This container fetches the daily verse and passes it to the `VerseOfTheDayCardComponent`.

Create `projects/domain/src/lib/verse-of-the-day-container/verse-of-the-day-container.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleService, VerseOfTheDay } from 'api';
import { VerseOfTheDayCardComponent } from 'components';

@Component({
  selector: 'lib-verse-of-the-day-container',
  standalone: true,
  imports: [CommonModule, VerseOfTheDayCardComponent],
  template: `
    @if (loading) {
      <p class="loading">Loading verse of the day...</p>
    } @else if (error) {
      <p class="error">{{ error }}</p>
    } @else if (verse) {
      <lib-verse-of-the-day-card
        [verseText]="verse.text"
        [reference]="verse.reference" />
    }
  `
})
export class VerseOfTheDayContainerComponent implements OnInit {
  verse: VerseOfTheDay | null = null;
  loading = true;
  error: string | null = null;

  constructor(private bibleService: BibleService) {}

  ngOnInit(): void {
    this.bibleService.getVerseOfTheDay().subscribe({
      next: (verse) => {
        this.verse = verse;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Could not load the verse of the day.';
        this.loading = false;
      }
    });
  }
}
```

**How this works step by step:**

1. **Initial state:** `loading = true`, `verse = null`, `error = null`
2. **`ngOnInit` runs** when the component first appears on screen
3. **Subscribes** to the Bible service's `getVerseOfTheDay()` Observable
4. **On success:** sets `verse` to the response data, sets `loading = false`
5. **On error:** sets `error` to a message, sets `loading = false`
6. **Template uses `@if`** to show loading, error, or the verse card based on state

**Understanding `subscribe({next, error})`:**
- `next` — called when data arrives successfully
- `error` — called when something goes wrong (network error, server error, etc.)

---

## Container 2: Bible Reader

This is the most complex container. It manages book selection, chapter navigation, and verse display.

Create `projects/domain/src/lib/bible-reader-container/bible-reader-container.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BibleService, BibleChapter } from 'api';
import { VerseItemComponent, ChapterNavComponent } from 'components';

@Component({
  selector: 'lib-bible-reader-container',
  standalone: true,
  imports: [CommonModule, VerseItemComponent, ChapterNavComponent],
  template: `
    <div class="bible-reader">
      <!-- Book sidebar / selector -->
      <aside class="sidebar">
        <h3>Books</h3>
        @for (book of books; track book.name) {
          <button [class.active]="book.name === selectedBook"
                  (click)="selectBook(book.name, book.chapters)">
            {{ book.name }}
          </button>
        }
      </aside>

      <!-- Reading pane -->
      <main class="reading-pane">
        @if (loading) {
          <p>Loading...</p>
        } @else if (chapter) {
          <h2>{{ chapter.reference }}</h2>
          <lib-chapter-nav
            [currentChapter]="selectedChapter"
            [totalChapters]="selectedBookChapters"
            (chapterSelected)="selectChapter($event)" />
          @for (verse of chapter.verses; track verse.verse) {
            <lib-verse-item
              [verseNumber]="verse.verse"
              [text]="verse.text" />
          }
        } @else {
          <p>Select a book and chapter to begin reading.</p>
        }
      </main>
    </div>
  `,
  styles: `
    .bible-reader { display: flex; min-height: 80vh; }
    .sidebar {
      width: 280px; background: #f7f0e8; padding: 24px 0;
      border-right: 1px solid #e8ddd0; overflow-y: auto;
    }
    .sidebar button {
      display: block; width: 100%; text-align: left;
      padding: 8px 24px; border: none; background: transparent;
      cursor: pointer; font-size: 14px;
    }
    .sidebar button.active { background: #8B6914; color: white; }
    .reading-pane { flex: 1; padding: 32px 64px; background: #ffffff; }
    h2 { font-family: 'Playfair Display', serif; }
  `
})
export class BibleReaderContainerComponent implements OnInit {
  chapter: BibleChapter | null = null;
  loading = false;
  selectedBook = 'Genesis';
  selectedChapter = 1;
  selectedBookChapters = 50;

  // A simplified list of Bible books with chapter counts
  books = [
    { name: 'Genesis', chapters: 50 },
    { name: 'Exodus', chapters: 40 },
    { name: 'Leviticus', chapters: 27 },
    { name: 'Numbers', chapters: 36 },
    { name: 'Deuteronomy', chapters: 34 },
    { name: 'Joshua', chapters: 24 },
    { name: 'Judges', chapters: 21 },
    { name: 'Ruth', chapters: 4 },
    { name: '1 Samuel', chapters: 31 },
    { name: '2 Samuel', chapters: 24 },
    { name: '1 Kings', chapters: 22 },
    { name: '2 Kings', chapters: 25 },
    { name: 'Psalms', chapters: 150 },
    { name: 'Proverbs', chapters: 31 },
    { name: 'Isaiah', chapters: 66 },
    { name: 'Matthew', chapters: 28 },
    { name: 'Mark', chapters: 16 },
    { name: 'Luke', chapters: 24 },
    { name: 'John', chapters: 21 },
    { name: 'Acts', chapters: 28 },
    { name: 'Romans', chapters: 16 },
    { name: '1 Corinthians', chapters: 16 },
    { name: 'Revelation', chapters: 22 },
    // Add the rest as needed
  ];

  constructor(private bibleService: BibleService) {}

  ngOnInit(): void {
    this.loadChapter();
  }

  selectBook(name: string, chapters: number): void {
    this.selectedBook = name;
    this.selectedBookChapters = chapters;
    this.selectedChapter = 1;
    this.loadChapter();
  }

  selectChapter(chapter: number): void {
    this.selectedChapter = chapter;
    this.loadChapter();
  }

  private loadChapter(): void {
    this.loading = true;
    this.bibleService.getChapter(this.selectedBook, this.selectedChapter)
      .subscribe({
        next: (chapter) => {
          this.chapter = chapter;
          this.loading = false;
        },
        error: () => {
          this.chapter = null;
          this.loading = false;
        }
      });
  }
}
```

**How the Bible Reader works:**

1. Displays a sidebar of Bible books and a main reading pane
2. When a book is clicked: `selectBook()` updates the selected book and loads chapter 1
3. When the chapter nav Previous/Next buttons are clicked: `selectChapter()` loads the new chapter
4. `loadChapter()` calls the API and updates the display

---

## Container 3: Today's Devotional

Create `projects/domain/src/lib/today-devotional-container/today-devotional-container.component.ts`:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevotionalService, DevotionalDetail } from 'api';
import { DevotionalCardComponent } from 'components';

@Component({
  selector: 'lib-today-devotional-container',
  standalone: true,
  imports: [CommonModule, DevotionalCardComponent],
  template: `
    @if (loading) {
      <p>Loading today's devotional...</p>
    } @else if (devotional) {
      <lib-devotional-card
        [title]="devotional.title"
        [scriptureReference]="devotional.scriptureReference"
        [reflectionText]="devotional.reflectionText"
        [prayerPrompt]="devotional.prayerPrompt" />
    } @else {
      <p class="empty">No devotional available for today.</p>
    }
  `
})
export class TodayDevotionalContainerComponent implements OnInit {
  devotional: DevotionalDetail | null = null;
  loading = true;

  constructor(private devotionalService: DevotionalService) {}

  ngOnInit(): void {
    this.devotionalService.getToday().subscribe({
      next: (d) => { this.devotional = d; this.loading = false; },
      error: () => { this.devotional = null; this.loading = false; }
    });
  }
}
```

---

## Container 4: Devotional Archive

Create `projects/domain/src/lib/devotional-archive-container/devotional-archive-container.component.ts`:

```typescript
import { Component, OnInit, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevotionalService, DevotionalSummary } from 'api';
import { DevotionalSummaryCardComponent } from 'components';

@Component({
  selector: 'lib-devotional-archive-container',
  standalone: true,
  imports: [CommonModule, DevotionalSummaryCardComponent],
  template: `
    @if (loading) {
      <p>Loading archive...</p>
    } @else {
      @for (d of devotionals; track d.id) {
        <lib-devotional-summary-card
          [title]="d.title"
          [date]="d.date"
          [scriptureReference]="d.scriptureReference"
          [excerpt]="d.excerpt"
          (selected)="devotionalSelected.emit(d.id)" />
      }
      @if (hasNextPage) {
        <button class="load-more" (click)="loadMore()">Load More</button>
      }
    }
  `
})
export class DevotionalArchiveContainerComponent implements OnInit {
  devotionals: DevotionalSummary[] = [];
  loading = true;
  hasNextPage = false;
  page = 1;
  devotionalSelected = output<number>();

  constructor(private devotionalService: DevotionalService) {}

  ngOnInit(): void {
    this.load();
  }

  loadMore(): void {
    this.page++;
    this.load();
  }

  private load(): void {
    this.devotionalService.getAll(this.page, 10).subscribe({
      next: (result) => {
        this.devotionals = [...this.devotionals, ...result.items];
        this.hasNextPage = result.hasNextPage;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }
}
```

**How pagination works in the UI:**
1. First load: fetches page 1 (10 items)
2. "Load More" click: fetches page 2 and *appends* to the existing list
3. `[...this.devotionals, ...result.items]` — merges old and new items
4. The button disappears when `hasNextPage` is false

---

## Container 5: Homepage

Create `projects/domain/src/lib/homepage-container/homepage-container.component.ts`:

```typescript
import { Component, output } from '@angular/core';
import { HeroComponent, FeatureCardComponent, FooterComponent } from 'components';
import { VerseOfTheDayContainerComponent } from '../verse-of-the-day-container/verse-of-the-day-container.component';

@Component({
  selector: 'lib-homepage-container',
  standalone: true,
  imports: [
    HeroComponent, FeatureCardComponent, FooterComponent,
    VerseOfTheDayContainerComponent
  ],
  template: `
    <lib-hero
      tagline="Scripture & Reflection"
      title="Welcome to GraceWord"
      description="Your daily companion for Bible reading and spiritual growth."
      primaryCta="Start Reading"
      secondaryCta="Explore Devotionals"
      (primaryClick)="navigated.emit('/bible')"
      (secondaryClick)="navigated.emit('/devotionals')" />

    <section class="verse-section">
      <lib-verse-of-the-day-container />
    </section>

    <section class="features">
      <lib-feature-card
        title="Read the Bible"
        description="Browse any book and chapter with a clean, readable interface."
        actionLabel="Start Reading"
        (actionClick)="navigated.emit('/bible')" />
      <lib-feature-card
        title="Daily Devotionals"
        description="Find daily inspiration with scripture-based reflections and prayers."
        actionLabel="View Devotionals"
        (actionClick)="navigated.emit('/devotionals')" />
    </section>

    <lib-footer />
  `,
  styles: `
    .verse-section { padding: 64px 56px; background: #FFFAF5; }
    .features { display: flex; gap: 32px; padding: 64px 56px; background: #f7f0e8; }
  `
})
export class HomepageContainerComponent {
  navigated = output<string>();
}
```

---

## Container 6: Devotional Page

Create `projects/domain/src/lib/devotional-page-container/devotional-page-container.component.ts`:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevotionalService, DevotionalDetail } from 'api';
import { DevotionalCardComponent } from 'components';
import { TodayDevotionalContainerComponent } from '../today-devotional-container/today-devotional-container.component';
import { DevotionalArchiveContainerComponent } from '../devotional-archive-container/devotional-archive-container.component';

@Component({
  selector: 'lib-devotional-page-container',
  standalone: true,
  imports: [
    CommonModule, DevotionalCardComponent,
    TodayDevotionalContainerComponent,
    DevotionalArchiveContainerComponent
  ],
  template: `
    <div class="devotional-page">
      <main class="main-column">
        @if (selectedDevotional) {
          <lib-devotional-card
            [title]="selectedDevotional.title"
            [scriptureReference]="selectedDevotional.scriptureReference"
            [reflectionText]="selectedDevotional.reflectionText"
            [prayerPrompt]="selectedDevotional.prayerPrompt" />
        } @else {
          <lib-today-devotional-container />
        }
      </main>
      <aside class="sidebar">
        <h3>Archive</h3>
        <lib-devotional-archive-container
          (devotionalSelected)="onDevotionalSelected($event)" />
      </aside>
    </div>
  `,
  styles: `
    .devotional-page {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 32px;
      padding: 48px 56px;
    }
    .sidebar h3 { font-family: 'Playfair Display', serif; margin-bottom: 16px; }
  `
})
export class DevotionalPageContainerComponent {
  selectedDevotional: DevotionalDetail | null = null;

  constructor(private devotionalService: DevotionalService) {}

  onDevotionalSelected(id: number): void {
    this.devotionalService.getById(id).subscribe({
      next: (d) => { this.selectedDevotional = d; },
      error: () => {}
    });
  }
}
```

---

## Export Everything

Edit `projects/domain/src/public-api.ts`:

```typescript
export * from './lib/verse-of-the-day-container/verse-of-the-day-container.component';
export * from './lib/bible-reader-container/bible-reader-container.component';
export * from './lib/today-devotional-container/today-devotional-container.component';
export * from './lib/devotional-archive-container/devotional-archive-container.component';
export * from './lib/homepage-container/homepage-container.component';
export * from './lib/devotional-page-container/devotional-page-container.component';
```

## Build

```bash
npx ng build api        # must build first (domain depends on it)
npx ng build components # must build second
npx ng build domain     # depends on both
```

---

## Alternative Stack: React

In React, "smart components" are usually pages or containers that use hooks:

```tsx
// src/pages/HomePage.tsx
import { useState, useEffect } from 'react';
import { getVerseOfTheDay, VerseOfTheDay } from '../api/bibleService';
import { VerseOfTheDayCard } from '../components/VerseOfTheDayCard';
import { Hero } from '../components/Hero';

export function HomePage() {
  const [verse, setVerse] = useState<VerseOfTheDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVerseOfTheDay()
      .then(setVerse)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Hero
        title="Welcome to GraceWord"
        onStartReading={() => navigate('/bible')}
      />
      {loading && <p>Loading...</p>}
      {verse && <VerseOfTheDayCard verseText={verse.text} reference={verse.reference} />}
    </>
  );
}
```

The pattern is the same: fetch data, manage loading/error state, pass data to presentational components.

---

[<<< Back to Frontend Components](10-frontend-components.md) | [Next: Frontend App & Routing >>>](12-frontend-app-and-routing.md)
