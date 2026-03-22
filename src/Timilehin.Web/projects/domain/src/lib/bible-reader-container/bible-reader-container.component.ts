import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { BibleChapter, BibleService, BibleVerse } from 'api';
import { ChapterNavComponent, VerseItemComponent } from 'components';
import { catchError, of, Subject, switchMap, tap } from 'rxjs';

export interface BibleBook {
  name: string;
  chapters: number;
  testament: 'OT' | 'NT';
}

export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { name: 'Genesis', chapters: 50, testament: 'OT' },
  { name: 'Exodus', chapters: 40, testament: 'OT' },
  { name: 'Leviticus', chapters: 27, testament: 'OT' },
  { name: 'Numbers', chapters: 36, testament: 'OT' },
  { name: 'Deuteronomy', chapters: 34, testament: 'OT' },
  { name: 'Joshua', chapters: 24, testament: 'OT' },
  { name: 'Judges', chapters: 21, testament: 'OT' },
  { name: 'Ruth', chapters: 4, testament: 'OT' },
  { name: '1 Samuel', chapters: 31, testament: 'OT' },
  { name: '2 Samuel', chapters: 24, testament: 'OT' },
  { name: '1 Kings', chapters: 22, testament: 'OT' },
  { name: '2 Kings', chapters: 25, testament: 'OT' },
  { name: '1 Chronicles', chapters: 29, testament: 'OT' },
  { name: '2 Chronicles', chapters: 36, testament: 'OT' },
  { name: 'Ezra', chapters: 10, testament: 'OT' },
  { name: 'Nehemiah', chapters: 13, testament: 'OT' },
  { name: 'Esther', chapters: 10, testament: 'OT' },
  { name: 'Job', chapters: 42, testament: 'OT' },
  { name: 'Psalms', chapters: 150, testament: 'OT' },
  { name: 'Proverbs', chapters: 31, testament: 'OT' },
  { name: 'Ecclesiastes', chapters: 12, testament: 'OT' },
  { name: 'Song of Solomon', chapters: 8, testament: 'OT' },
  { name: 'Isaiah', chapters: 66, testament: 'OT' },
  { name: 'Jeremiah', chapters: 52, testament: 'OT' },
  { name: 'Lamentations', chapters: 5, testament: 'OT' },
  { name: 'Ezekiel', chapters: 48, testament: 'OT' },
  { name: 'Daniel', chapters: 12, testament: 'OT' },
  { name: 'Hosea', chapters: 14, testament: 'OT' },
  { name: 'Joel', chapters: 3, testament: 'OT' },
  { name: 'Amos', chapters: 9, testament: 'OT' },
  { name: 'Obadiah', chapters: 1, testament: 'OT' },
  { name: 'Jonah', chapters: 4, testament: 'OT' },
  { name: 'Micah', chapters: 7, testament: 'OT' },
  { name: 'Nahum', chapters: 3, testament: 'OT' },
  { name: 'Habakkuk', chapters: 3, testament: 'OT' },
  { name: 'Zephaniah', chapters: 3, testament: 'OT' },
  { name: 'Haggai', chapters: 2, testament: 'OT' },
  { name: 'Zechariah', chapters: 14, testament: 'OT' },
  { name: 'Malachi', chapters: 4, testament: 'OT' },
  // New Testament
  { name: 'Matthew', chapters: 28, testament: 'NT' },
  { name: 'Mark', chapters: 16, testament: 'NT' },
  { name: 'Luke', chapters: 24, testament: 'NT' },
  { name: 'John', chapters: 21, testament: 'NT' },
  { name: 'Acts', chapters: 28, testament: 'NT' },
  { name: 'Romans', chapters: 16, testament: 'NT' },
  { name: '1 Corinthians', chapters: 16, testament: 'NT' },
  { name: '2 Corinthians', chapters: 13, testament: 'NT' },
  { name: 'Galatians', chapters: 6, testament: 'NT' },
  { name: 'Ephesians', chapters: 6, testament: 'NT' },
  { name: 'Philippians', chapters: 4, testament: 'NT' },
  { name: 'Colossians', chapters: 4, testament: 'NT' },
  { name: '1 Thessalonians', chapters: 5, testament: 'NT' },
  { name: '2 Thessalonians', chapters: 3, testament: 'NT' },
  { name: '1 Timothy', chapters: 6, testament: 'NT' },
  { name: '2 Timothy', chapters: 4, testament: 'NT' },
  { name: 'Titus', chapters: 3, testament: 'NT' },
  { name: 'Philemon', chapters: 1, testament: 'NT' },
  { name: 'Hebrews', chapters: 13, testament: 'NT' },
  { name: 'James', chapters: 5, testament: 'NT' },
  { name: '1 Peter', chapters: 5, testament: 'NT' },
  { name: '2 Peter', chapters: 3, testament: 'NT' },
  { name: '1 John', chapters: 5, testament: 'NT' },
  { name: '2 John', chapters: 1, testament: 'NT' },
  { name: '3 John', chapters: 1, testament: 'NT' },
  { name: 'Jude', chapters: 1, testament: 'NT' },
  { name: 'Revelation', chapters: 22, testament: 'NT' },
];

@Component({
  selector: 'gw-bible-reader-container',
  standalone: true,
  imports: [FormsModule, VerseItemComponent, ChapterNavComponent],
  templateUrl: './bible-reader-container.component.html',
  styleUrl: './bible-reader-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BibleReaderContainerComponent {
  private readonly bibleService = inject(BibleService);

  /** Output emitted when a book and chapter are selected. */
  bookSelected = output<{ book: string; chapter: number }>();

  /** All 66 Bible books. */
  readonly books = BIBLE_BOOKS;

  /** Search / filter term for the sidebar book list. */
  readonly searchTerm = signal('');

  /** Currently selected book (null until user picks one). */
  readonly selectedBook = signal<BibleBook | null>(null);

  /** Currently selected chapter number. */
  readonly selectedChapter = signal(1);

  /** Loading state. */
  readonly loading = signal(false);

  /** Error message when fetch fails. */
  readonly error = signal<string | null>(null);

  /** Subject that drives the chapter-fetch stream. */
  private readonly fetchChapter$ = new Subject<{
    book: string;
    chapter: number;
  }>();

  /** The chapter data returned from the API, kept as a signal via toSignal. */
  readonly chapterData = toSignal(
    this.fetchChapter$.pipe(
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap(({ book, chapter }) =>
        this.bibleService.getChapter(book, chapter).pipe(
          catchError((err) => {
            this.error.set(
              err?.message ?? 'Failed to load chapter. Please try again.'
            );
            return of(null);
          })
        )
      ),
      tap(() => this.loading.set(false))
    )
  );

  /** Old Testament books filtered by search term. */
  readonly oldTestamentBooks = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.books.filter(
      (b) => b.testament === 'OT' && b.name.toLowerCase().includes(term)
    );
  });

  /** New Testament books filtered by search term. */
  readonly newTestamentBooks = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.books.filter(
      (b) => b.testament === 'NT' && b.name.toLowerCase().includes(term)
    );
  });

  /** Total chapters for the currently selected book. */
  readonly totalChapters = computed(
    () => this.selectedBook()?.chapters ?? 0
  );

  /** Whether a previous chapter exists. */
  readonly hasPrevious = computed(() => this.selectedChapter() > 1);

  /** Whether a next chapter exists. */
  readonly hasNext = computed(
    () => this.selectedChapter() < this.totalChapters()
  );

  /** Header text shown above the reading pane. */
  readonly headerText = computed(() => {
    const book = this.selectedBook();
    if (!book) return '';
    return `${book.name} ${this.selectedChapter()}`;
  });

  /** Select a book (resets to chapter 1 and fetches). */
  selectBook(book: BibleBook): void {
    this.selectedBook.set(book);
    this.selectedChapter.set(1);
    this.loadChapter(book.name, 1);
  }

  /** Navigate to the previous chapter. */
  goToPreviousChapter(): void {
    const chapter = this.selectedChapter() - 1;
    if (chapter < 1) return;
    this.selectedChapter.set(chapter);
    this.loadChapter(this.selectedBook()!.name, chapter);
  }

  /** Navigate to the next chapter. */
  goToNextChapter(): void {
    const chapter = this.selectedChapter() + 1;
    if (chapter > this.totalChapters()) return;
    this.selectedChapter.set(chapter);
    this.loadChapter(this.selectedBook()!.name, chapter);
  }

  /** Handle chapter selected from nav (re-fetches current chapter). */
  onChapterSelected(): void {
    this.loadChapter(
      this.selectedBook()!.name,
      this.selectedChapter()
    );
  }

  private loadChapter(book: string, chapter: number): void {
    this.bookSelected.emit({ book, chapter });
    this.fetchChapter$.next({ book, chapter });
  }
}
