# 10 — Frontend Components (Presentational)

In this chapter, you will build the **presentational components** — the visual building blocks of the application. These components know how to *display* data but have no knowledge of where the data comes from.

---

## The Component Pattern

Every Angular component has:
1. **A TypeScript file** (`.ts`) — the logic and data inputs
2. **An HTML template** — what gets rendered on screen (can be inline or in a separate file)
3. **A CSS/SCSS file** — the styling (can be inline or separate)

A simple component looks like:

```typescript
import { Component, input } from '@angular/core';

@Component({
  selector: 'lib-verse-item',
  standalone: true,
  template: `
    <span class="verse-number">{{ verseNumber() }}</span>
    <span class="verse-text">{{ text() }}</span>
  `,
  styles: `
    .verse-number { font-weight: bold; margin-right: 4px; }
  `
})
export class VerseItemComponent {
  verseNumber = input.required<number>();
  text = input.required<string>();
}
```

**What each part means:**

| Part | Purpose |
|------|---------|
| `@Component({...})` | Decorator that tells Angular "this class is a component" |
| `selector: 'lib-verse-item'` | The HTML tag name: `<lib-verse-item>` |
| `standalone: true` | This component is self-contained (modern Angular pattern) |
| `template` | The HTML that renders |
| `styles` | CSS scoped to this component only |
| `input.required<number>()` | A required input from the parent component |
| `{{ verseNumber() }}` | Interpolation — inserts the value into the HTML |

---

## Components You Need to Build

Here is every component in the `components` library:

### 1. Navbar

The navigation bar at the top of every page.

```typescript
// projects/components/src/lib/navbar/navbar.component.ts
import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav class="navbar">
      <div class="brand" (click)="linkClicked.emit('/')">
        <span class="brand-name">GraceWord</span>
      </div>
      <ul class="nav-links">
        @for (link of links(); track link.path) {
          <li>
            <a [class.active]="link.path === activePath()"
               (click)="linkClicked.emit(link.path)">
              {{ link.label }}
            </a>
          </li>
        }
      </ul>
    </nav>
  `,
  styles: `
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 56px;
      background: #FFFAF5;
      position: sticky;
      top: 0;
      z-index: 100;
      border-bottom: 1px solid #e8ddd0;
    }
    .brand-name { font-family: 'Playfair Display', serif; font-size: 24px; }
    .nav-links { display: flex; list-style: none; gap: 32px; }
    .nav-links a { text-decoration: none; color: #4a4a4a; font-size: 14px; cursor: pointer; }
    .nav-links a.active { color: #8B6914; font-weight: 600; }
  `
})
export class NavbarComponent {
  links = input.required<{ label: string; path: string }[]>();
  activePath = input<string>('/');
  linkClicked = output<string>();
}
```

**Key concepts:**
- `input.required<...>()` — data passed in from a parent component
- `output<string>()` — an event emitted to the parent (when a link is clicked)
- `(click)="..."` — event binding (runs code when the element is clicked)
- `@for (link of links(); track link.path)` — loops over the links array
- `[class.active]="..."` — conditionally applies a CSS class

### 2. Hero Section

The large banner at the top of the homepage.

```typescript
// projects/components/src/lib/hero/hero.component.ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'lib-hero',
  standalone: true,
  template: `
    <section class="hero">
      <span class="tagline">{{ tagline() }}</span>
      <h1>{{ title() }}</h1>
      <p class="description">{{ description() }}</p>
      <div class="cta-buttons">
        <button class="btn-primary" (click)="primaryClick.emit()">
          {{ primaryCta() }}
        </button>
        <button class="btn-secondary" (click)="secondaryClick.emit()">
          {{ secondaryCta() }}
        </button>
      </div>
    </section>
  `,
  styles: `
    .hero {
      min-height: 480px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 64px 24px;
      background: linear-gradient(135deg, #FFFAF5, #f7f0e8);
    }
    h1 { font-family: 'Playfair Display', serif; font-size: 56px; margin: 16px 0; }
    .tagline { color: #8B6914; font-weight: 600; text-transform: uppercase; font-size: 14px; }
    .description { color: #6b6b6b; max-width: 600px; line-height: 1.6; }
    .cta-buttons { display: flex; gap: 16px; margin-top: 32px; }
    .btn-primary {
      background: #8B6914; color: white; border: none; padding: 14px 32px;
      border-radius: 8px; cursor: pointer; font-size: 16px;
    }
    .btn-secondary {
      background: transparent; color: #8B6914; border: 2px solid #8B6914;
      padding: 14px 32px; border-radius: 8px; cursor: pointer; font-size: 16px;
    }
  `
})
export class HeroComponent {
  tagline = input<string>('');
  title = input.required<string>();
  description = input<string>('');
  primaryCta = input<string>('Get Started');
  secondaryCta = input<string>('Learn More');
  primaryClick = output<void>();
  secondaryClick = output<void>();
}
```

### 3. Verse of the Day Card

```typescript
// projects/components/src/lib/verse-of-the-day-card/verse-of-the-day-card.component.ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'lib-verse-of-the-day-card',
  standalone: true,
  template: `
    <div class="verse-card">
      <h2 class="section-title">Verse of the Day</h2>
      <blockquote class="verse-text">{{ verseText() }}</blockquote>
      <cite class="reference">— {{ reference() }}</cite>
    </div>
  `,
  styles: `
    .verse-card {
      background: #ffffff;
      border-radius: 16px;
      padding: 48px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .section-title { color: #8B6914; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; }
    .verse-text {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 24px;
      line-height: 1.6;
      color: #2a2a2a;
      margin: 24px 0;
    }
    .reference { color: #8B6914; font-size: 16px; }
  `
})
export class VerseOfTheDayCardComponent {
  verseText = input.required<string>();
  reference = input.required<string>();
}
```

### 4. Verse Item (for Bible Reader)

```typescript
// projects/components/src/lib/verse-item/verse-item.component.ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'lib-verse-item',
  standalone: true,
  template: `
    <p class="verse">
      <sup class="verse-number">{{ verseNumber() }}</sup>
      <span>{{ text() }}</span>
    </p>
  `,
  styles: `
    .verse { line-height: 1.8; margin: 4px 0; }
    .verse-number { color: #8B6914; font-weight: 700; margin-right: 4px; font-size: 0.75em; }
  `
})
export class VerseItemComponent {
  verseNumber = input.required<number>();
  text = input.required<string>();
}
```

### 5. Chapter Navigation

```typescript
// projects/components/src/lib/chapter-nav/chapter-nav.component.ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'lib-chapter-nav',
  standalone: true,
  template: `
    <div class="chapter-nav">
      <button [disabled]="currentChapter() <= 1"
              (click)="chapterSelected.emit(currentChapter() - 1)">
        Previous
      </button>
      <span>Chapter {{ currentChapter() }}</span>
      <button [disabled]="currentChapter() >= totalChapters()"
              (click)="chapterSelected.emit(currentChapter() + 1)">
        Next
      </button>
    </div>
  `,
  styles: `
    .chapter-nav { display: flex; align-items: center; gap: 16px; }
    button {
      background: #8B6914; color: white; border: none;
      padding: 8px 20px; border-radius: 6px; cursor: pointer;
    }
    button:disabled { opacity: 0.4; cursor: not-allowed; }
  `
})
export class ChapterNavComponent {
  currentChapter = input.required<number>();
  totalChapters = input.required<number>();
  chapterSelected = output<number>();
}
```

### 6. Devotional Card

```typescript
// projects/components/src/lib/devotional-card/devotional-card.component.ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'lib-devotional-card',
  standalone: true,
  template: `
    <article class="devotional-card">
      <h2>{{ title() }}</h2>
      <p class="scripture">{{ scriptureReference() }}</p>
      <div class="reflection">{{ reflectionText() }}</div>
      <div class="prayer">
        <h3>Prayer</h3>
        <p>{{ prayerPrompt() }}</p>
      </div>
    </article>
  `,
  styles: `
    .devotional-card {
      background: #ffffff; border-radius: 16px; padding: 40px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    h2 { font-family: 'Playfair Display', serif; font-size: 28px; }
    .scripture { color: #8B6914; font-style: italic; margin: 8px 0 24px; }
    .reflection { line-height: 1.8; color: #4a4a4a; }
    .prayer {
      margin-top: 32px; padding-top: 24px;
      border-top: 1px solid #e8ddd0;
    }
    .prayer h3 { color: #8B6914; font-size: 14px; text-transform: uppercase; }
  `
})
export class DevotionalCardComponent {
  title = input.required<string>();
  scriptureReference = input.required<string>();
  reflectionText = input.required<string>();
  prayerPrompt = input.required<string>();
}
```

### 7. Devotional Summary Card

```typescript
// projects/components/src/lib/devotional-summary-card/devotional-summary-card.component.ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'lib-devotional-summary-card',
  standalone: true,
  template: `
    <div class="summary-card" (click)="selected.emit()">
      <h3>{{ title() }}</h3>
      <span class="date">{{ date() }}</span>
      <p class="scripture">{{ scriptureReference() }}</p>
      <p class="excerpt">{{ excerpt() }}</p>
    </div>
  `,
  styles: `
    .summary-card {
      background: #ffffff; border-radius: 12px; padding: 20px;
      cursor: pointer; transition: box-shadow 0.2s;
      border: 1px solid #e8ddd0;
    }
    .summary-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    h3 { font-family: 'Playfair Display', serif; font-size: 18px; margin: 0 0 4px; }
    .date { color: #999; font-size: 13px; }
    .scripture { color: #8B6914; font-style: italic; font-size: 14px; }
    .excerpt { color: #6b6b6b; font-size: 14px; line-height: 1.5; }
  `
})
export class DevotionalSummaryCardComponent {
  title = input.required<string>();
  date = input.required<string>();
  scriptureReference = input.required<string>();
  excerpt = input.required<string>();
  selected = output<void>();
}
```

### 8. Feature Card

```typescript
// projects/components/src/lib/feature-card/feature-card.component.ts
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'lib-feature-card',
  standalone: true,
  template: `
    <div class="feature-card">
      <h3>{{ title() }}</h3>
      <p>{{ description() }}</p>
      <button (click)="actionClick.emit()">{{ actionLabel() }}</button>
    </div>
  `,
  styles: `
    .feature-card {
      background: #ffffff; border-radius: 16px; padding: 32px;
      flex: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    h3 { font-family: 'Playfair Display', serif; font-size: 22px; }
    p { color: #6b6b6b; line-height: 1.6; }
    button {
      background: transparent; color: #8B6914; border: 2px solid #8B6914;
      padding: 10px 24px; border-radius: 8px; cursor: pointer; margin-top: 16px;
    }
  `
})
export class FeatureCardComponent {
  title = input.required<string>();
  description = input.required<string>();
  actionLabel = input<string>('Learn More');
  actionClick = output<void>();
}
```

### 9. Footer

```typescript
// projects/components/src/lib/footer/footer.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'lib-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <div class="footer-content">
        <div class="brand">GraceWord</div>
        <p class="tagline">Your daily companion for scripture and reflection.</p>
        <p class="copyright">&copy; 2026 GraceWord. All rights reserved.</p>
      </div>
    </footer>
  `,
  styles: `
    .footer {
      background: #1A1A2E; color: #ffffff; padding: 48px 56px;
      text-align: center;
    }
    .brand { font-family: 'Playfair Display', serif; font-size: 24px; margin-bottom: 8px; }
    .tagline { color: #a0a0b0; font-size: 14px; }
    .copyright { color: #666680; font-size: 12px; margin-top: 24px; }
  `
})
export class FooterComponent {}
```

---

## Step 2: Export All Components

Edit `projects/components/src/public-api.ts`:

```typescript
export * from './lib/navbar/navbar.component';
export * from './lib/hero/hero.component';
export * from './lib/verse-of-the-day-card/verse-of-the-day-card.component';
export * from './lib/verse-item/verse-item.component';
export * from './lib/chapter-nav/chapter-nav.component';
export * from './lib/devotional-card/devotional-card.component';
export * from './lib/devotional-summary-card/devotional-summary-card.component';
export * from './lib/feature-card/feature-card.component';
export * from './lib/footer/footer.component';
```

---

## Step 3: Build

```bash
npx ng build components
```

---

## Alternative Stack: React

In React, components are functions that return JSX:

```tsx
// src/components/VerseOfTheDayCard.tsx
interface Props {
  verseText: string;
  reference: string;
}

export function VerseOfTheDayCard({ verseText, reference }: Props) {
  return (
    <div className="verse-card">
      <h2 className="section-title">Verse of the Day</h2>
      <blockquote className="verse-text">{verseText}</blockquote>
      <cite className="reference">— {reference}</cite>
    </div>
  );
}
```

The concept is identical: components receive props (inputs), display them, and emit events (via callback props). The syntax is different but the pattern is the same.

## Alternative Stack: Vue

```vue
<!-- src/components/VerseOfTheDayCard.vue -->
<template>
  <div class="verse-card">
    <h2 class="section-title">Verse of the Day</h2>
    <blockquote class="verse-text">{{ verseText }}</blockquote>
    <cite class="reference">— {{ reference }}</cite>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  verseText: string;
  reference: string;
}>();
</script>

<style scoped>
.verse-card { background: #ffffff; border-radius: 16px; padding: 48px; text-align: center; }
</style>
```

---

[<<< Back to Frontend API Library](09-frontend-api-library.md) | [Next: Frontend Domain Containers >>>](11-frontend-domain-containers.md)
