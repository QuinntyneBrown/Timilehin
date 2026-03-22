# 09 — Frontend API Library

In this chapter, you will build the `api` library — the layer that communicates with the backend. It defines the shape of data (models) and provides services that make HTTP requests.

---

## Why a Separate API Library?

By isolating all HTTP communication in one library:
- Components never make HTTP calls directly
- If the API changes, you only update one place
- The types are defined once and reused everywhere

---

## Step 1: Define the Models

Models in TypeScript are **interfaces** — they describe the shape of data without any behavior.

Create `projects/api/src/lib/models/bible.model.ts`:

```typescript
export interface VerseOfTheDay {
  reference: string;
  text: string;
}

export interface BibleChapter {
  reference: string;
  verses: BibleVerse[];
  translation: string;
}

export interface BibleVerse {
  verse: number;
  text: string;
}
```

**Reading this:** "A `VerseOfTheDay` has a `reference` (like 'John 3:16') and `text` (the verse content). A `BibleChapter` has a `reference`, a list of `verses`, and a `translation` name."

Create `projects/api/src/lib/models/devotional.model.ts`:

```typescript
export interface DevotionalSummary {
  id: number;
  title: string;
  date: string;
  scriptureReference: string;
  excerpt: string;
}

export interface DevotionalDetail {
  id: number;
  title: string;
  date: string;
  scriptureReference: string;
  reflectionText: string;
  prayerPrompt: string;
}

export interface CreateDevotional {
  title: string;
  date: string;
  scriptureReference: string;
  reflectionText: string;
  prayerPrompt: string;
}

export interface UpdateDevotional {
  title?: string;
  date?: string;
  scriptureReference?: string;
  reflectionText?: string;
  prayerPrompt?: string;
}
```

The `?` after a property name means it is optional (same concept as the C# `?`).

Create `projects/api/src/lib/models/paginated-result.model.ts`:

```typescript
export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

The `<T>` is a **generic** — it means this interface works with any type. `PaginatedResult<DevotionalSummary>` is a paginated list of devotional summaries.

Create `projects/api/src/lib/models/index.ts` (a barrel export file):

```typescript
export * from './bible.model';
export * from './devotional.model';
export * from './paginated-result.model';
```

---

## Step 2: Create the Bible Service

Services use Angular's `HttpClient` to make requests to the backend.

Create `projects/api/src/lib/services/bible.service.ts`:

```typescript
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BibleChapter, VerseOfTheDay } from '../models';

@Injectable({ providedIn: 'root' })
export class BibleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/bible';

  getChapter(book: string, chapter: number): Observable<BibleChapter> {
    return this.http.get<BibleChapter>(
      `${this.baseUrl}/${encodeURIComponent(book)}/${chapter}`
    );
  }

  getVerseOfTheDay(): Observable<VerseOfTheDay> {
    return this.http.get<VerseOfTheDay>('/api/verseoftheday');
  }
}
```

**Breaking it down:**

| Code | Meaning |
|------|---------|
| `@Injectable({ providedIn: 'root' })` | Makes this service available everywhere in the app, as a single shared instance |
| `inject(HttpClient)` | Gets the HTTP client from Angular's dependency injection |
| `Observable<BibleChapter>` | The return type. An Observable is like a promise that can emit values over time. For HTTP, it emits one response and completes |
| `this.http.get<BibleChapter>(url)` | Makes a GET request to the URL and expects the response to match the `BibleChapter` shape |
| `encodeURIComponent(book)` | Safely encodes the book name for URLs (handles spaces in "1 Corinthians") |

**What is an Observable?**

An `Observable` is Angular's way of handling asynchronous data. Think of it as a newspaper subscription:
- You **subscribe** to it
- When the data arrives, your callback function runs
- For HTTP requests, it delivers one response and then completes

```typescript
// Example usage (you will see this in domain containers):
this.bibleService.getVerseOfTheDay().subscribe(verse => {
  this.verseText = verse.text;
  this.reference = verse.reference;
});
```

---

## Step 3: Create the Devotional Service

Create `projects/api/src/lib/services/devotional.service.ts`:

```typescript
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateDevotional,
  DevotionalDetail,
  DevotionalSummary,
  PaginatedResult,
  UpdateDevotional
} from '../models';

@Injectable({ providedIn: 'root' })
export class DevotionalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/devotionals';

  getAll(page: number = 1, pageSize: number = 10):
      Observable<PaginatedResult<DevotionalSummary>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PaginatedResult<DevotionalSummary>>(
      this.baseUrl, { params }
    );
  }

  getById(id: number): Observable<DevotionalDetail> {
    return this.http.get<DevotionalDetail>(`${this.baseUrl}/${id}`);
  }

  getToday(): Observable<DevotionalDetail> {
    return this.http.get<DevotionalDetail>(`${this.baseUrl}/today`);
  }

  create(devotional: CreateDevotional): Observable<DevotionalDetail> {
    return this.http.post<DevotionalDetail>(this.baseUrl, devotional);
  }

  update(id: number, devotional: UpdateDevotional):
      Observable<DevotionalDetail> {
    return this.http.put<DevotionalDetail>(
      `${this.baseUrl}/${id}`, devotional
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
```

**New concepts:**

| Code | Meaning |
|------|---------|
| `HttpParams` | Builds URL query parameters (`?page=1&pageSize=10`) in a safe, structured way |
| `this.http.post(url, body)` | Makes a POST request with the devotional data as the request body |
| `this.http.put(url, body)` | Makes a PUT request for updating |
| `this.http.delete(url)` | Makes a DELETE request |
| `Observable<void>` | The delete endpoint returns no data (204 No Content) |

Create `projects/api/src/lib/services/index.ts`:

```typescript
export * from './bible.service';
export * from './devotional.service';
```

---

## Step 4: Update the Public API

Edit `projects/api/src/public-api.ts`:

```typescript
export * from './lib/models';
export * from './lib/services';
```

Now any other library can import from `api`:

```typescript
import { BibleService, VerseOfTheDay } from 'api';
```

---

## Step 5: Build the Library

```bash
npx ng build api
```

If the build succeeds with no errors, the library is ready.

---

## Alternative Stack: React (with Axios)

```typescript
// src/api/bibleService.ts
import axios from 'axios';

export interface VerseOfTheDay {
  reference: string;
  text: string;
}

export interface BibleChapter {
  reference: string;
  verses: { verse: number; text: string }[];
  translation: string;
}

const API_BASE = '/api';

export async function getVerseOfTheDay(): Promise<VerseOfTheDay> {
  const { data } = await axios.get(`${API_BASE}/verseoftheday`);
  return data;
}

export async function getChapter(
  book: string, chapter: number
): Promise<BibleChapter> {
  const { data } = await axios.get(
    `${API_BASE}/bible/${encodeURIComponent(book)}/${chapter}`
  );
  return data;
}
```

## Alternative Stack: Vue (with fetch)

```typescript
// src/api/bibleService.ts
export async function getVerseOfTheDay() {
  const response = await fetch('/api/verseoftheday');
  return response.json();
}

export async function getChapter(book: string, chapter: number) {
  const response = await fetch(
    `/api/bible/${encodeURIComponent(book)}/${chapter}`
  );
  if (!response.ok) return null;
  return response.json();
}
```

**Key difference:** Angular uses Observables with `HttpClient`. React/Vue typically use Promises with `axios` or `fetch`. The concepts are the same — make an HTTP request, get data back — just different syntax.

---

[<<< Back to Frontend Project Setup](08-frontend-project-setup.md) | [Next: Frontend Components >>>](10-frontend-components.md)
