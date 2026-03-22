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
