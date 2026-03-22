import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, input } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { BibleService, BibleChapter } from 'api';
import {
  BibleReaderContainerComponent,
  BIBLE_BOOKS,
} from './bible-reader-container.component';

// --- Stubs for presentational components ---

@Component({
  selector: 'gw-verse-item',
  standalone: true,
  template: '<span class="verse">{{ number() }}: {{ text() }}</span>',
})
class VerseItemStubComponent {
  number = input.required<number>();
  text = input.required<string>();
}

@Component({
  selector: 'gw-chapter-nav',
  standalone: true,
  template: '',
})
class ChapterNavStubComponent {
  currentChapter = input.required<number>();
  totalChapters = input.required<number>();
  hasPrevious = input<boolean>(true);
  hasNext = input<boolean>(true);
}

// --- Mock data ---

const mockChapter: BibleChapter = {
  reference: 'Genesis 1',
  translation: 'KJV',
  verses: [
    { verse: 1, text: 'In the beginning God created the heaven and the earth.' },
    { verse: 2, text: 'And the earth was without form, and void.' },
    { verse: 3, text: 'And God said, Let there be light: and there was light.' },
  ],
};

describe('BibleReaderContainerComponent', () => {
  let fixture: ComponentFixture<BibleReaderContainerComponent>;
  let component: BibleReaderContainerComponent;
  let bibleServiceSpy: jasmine.SpyObj<BibleService>;

  beforeEach(async () => {
    bibleServiceSpy = jasmine.createSpyObj('BibleService', ['getChapter']);
    bibleServiceSpy.getChapter.and.returnValue(of(mockChapter));

    await TestBed.configureTestingModule({
      imports: [BibleReaderContainerComponent],
      providers: [{ provide: BibleService, useValue: bibleServiceSpy }],
    })
      .overrideComponent(BibleReaderContainerComponent, {
        remove: { imports: [] },
        add: {
          imports: [VerseItemStubComponent, ChapterNavStubComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BibleReaderContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should contain 66 Bible books', () => {
    expect(BIBLE_BOOKS.length).toBe(66);
    expect(BIBLE_BOOKS.filter((b) => b.testament === 'OT').length).toBe(39);
    expect(BIBLE_BOOKS.filter((b) => b.testament === 'NT').length).toBe(27);
  });

  it('should call BibleService.getChapter when a book is selected', () => {
    const genesis = BIBLE_BOOKS.find((b) => b.name === 'Genesis')!;
    component.selectBook(genesis);
    fixture.detectChanges();

    expect(bibleServiceSpy.getChapter).toHaveBeenCalledWith('Genesis', 1);
  });

  it('should set the selected book and chapter to 1 on selectBook', () => {
    const exodus = BIBLE_BOOKS.find((b) => b.name === 'Exodus')!;
    component.selectBook(exodus);

    expect(component.selectedBook()).toBe(exodus);
    expect(component.selectedChapter()).toBe(1);
  });

  it('should render verse items after chapter loads', async () => {
    const genesis = BIBLE_BOOKS.find((b) => b.name === 'Genesis')!;
    component.selectBook(genesis);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const verseElements =
      fixture.nativeElement.querySelectorAll('gw-verse-item');
    expect(verseElements.length).toBe(3);
  });

  it('should display the header with book name and chapter', () => {
    const genesis = BIBLE_BOOKS.find((b) => b.name === 'Genesis')!;
    component.selectBook(genesis);
    fixture.detectChanges();

    const header: HTMLElement =
      fixture.nativeElement.querySelector('.bible-reader__header');
    expect(header?.textContent?.trim()).toBe('Genesis 1');
  });

  it('should show loading indicator while fetching', () => {
    // Return a subject that never completes to keep loading true
    const pending$ = new Subject<BibleChapter>();
    bibleServiceSpy.getChapter.and.returnValue(pending$.asObservable());

    const genesis = BIBLE_BOOKS.find((b) => b.name === 'Genesis')!;
    component.selectBook(genesis);
    fixture.detectChanges();

    const loadingEl = fixture.nativeElement.querySelector(
      '.bible-reader__loading'
    );
    expect(loadingEl).toBeTruthy();
  });

  it('should display an error message on API failure', () => {
    bibleServiceSpy.getChapter.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    const genesis = BIBLE_BOOKS.find((b) => b.name === 'Genesis')!;
    component.selectBook(genesis);
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector(
      '.bible-reader__error'
    );
    expect(errorEl?.textContent).toContain('Network error');
  });

  it('should emit bookSelected output when selecting a book', () => {
    const emitted: { book: string; chapter: number }[] = [];
    component.bookSelected.subscribe((val) => emitted.push(val));

    const genesis = BIBLE_BOOKS.find((b) => b.name === 'Genesis')!;
    component.selectBook(genesis);

    expect(emitted).toEqual([{ book: 'Genesis', chapter: 1 }]);
  });

  it('should navigate to next chapter', () => {
    const genesis = BIBLE_BOOKS.find((b) => b.name === 'Genesis')!;
    component.selectBook(genesis);
    bibleServiceSpy.getChapter.calls.reset();

    component.goToNextChapter();

    expect(component.selectedChapter()).toBe(2);
    expect(bibleServiceSpy.getChapter).toHaveBeenCalledWith('Genesis', 2);
  });

  it('should filter books by search term', () => {
    component.searchTerm.set('gen');
    expect(component.oldTestamentBooks().length).toBe(1);
    expect(component.oldTestamentBooks()[0].name).toBe('Genesis');
  });
});
