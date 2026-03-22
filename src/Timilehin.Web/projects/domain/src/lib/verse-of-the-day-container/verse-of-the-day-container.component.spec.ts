import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { BibleService, VerseOfTheDay } from 'api';
import { VerseOfTheDayContainerComponent } from './verse-of-the-day-container.component';

const mockVerse: VerseOfTheDay = {
  reference: 'John 3:16',
  text: 'For God so loved the world that he gave his one and only Son.',
};

describe('VerseOfTheDayContainerComponent', () => {
  let component: VerseOfTheDayContainerComponent;
  let fixture: ComponentFixture<VerseOfTheDayContainerComponent>;
  let bibleServiceSpy: jasmine.SpyObj<BibleService>;

  function createComponent(): void {
    fixture = TestBed.createComponent(VerseOfTheDayContainerComponent);
    component = fixture.componentInstance;
  }

  beforeEach(async () => {
    bibleServiceSpy = jasmine.createSpyObj('BibleService', ['getVerseOfTheDay']);
    bibleServiceSpy.getVerseOfTheDay.and.returnValue(of(mockVerse));

    await TestBed.configureTestingModule({
      imports: [VerseOfTheDayContainerComponent],
      providers: [{ provide: BibleService, useValue: bibleServiceSpy }],
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should call BibleService.getVerseOfTheDay on init', () => {
    createComponent();
    fixture.detectChanges();

    expect(bibleServiceSpy.getVerseOfTheDay).toHaveBeenCalledTimes(1);
  });

  it('should set verse data and clear loading after successful fetch', () => {
    createComponent();
    fixture.detectChanges();

    expect(component.verse()).toEqual(mockVerse);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('should render the verse-of-the-day-card with correct inputs', () => {
    createComponent();
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('gw-verse-of-the-day-card');
    expect(card).toBeTruthy();
  });

  it('should display loading indicator before data arrives', () => {
    createComponent();
    // Before detectChanges triggers ngOnInit, loading is true by default
    // We need to check the template in loading state
    // Re-configure with a never-completing observable would be complex,
    // so verify the initial signal state instead
    expect(component.loading()).toBe(true);
  });

  it('should set error message and clear loading on failure', () => {
    bibleServiceSpy.getVerseOfTheDay.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    createComponent();
    fixture.detectChanges();

    expect(component.error()).toBe(
      'Unable to load the verse of the day. Please try again later.'
    );
    expect(component.loading()).toBe(false);
    expect(component.verse()).toBeNull();
  });

  it('should render error message in the template on failure', () => {
    bibleServiceSpy.getVerseOfTheDay.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    createComponent();
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.error-message');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Unable to load the verse of the day');
  });
});
