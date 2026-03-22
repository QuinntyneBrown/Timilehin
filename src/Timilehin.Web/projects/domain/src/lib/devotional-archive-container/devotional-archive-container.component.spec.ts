import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DevotionalService, DevotionalSummary, PaginatedResult } from 'api';
import { DevotionalArchiveContainerComponent } from './devotional-archive-container.component';

const mockSummaries: DevotionalSummary[] = [
  { id: 1, title: 'Day 1', date: '2026-03-20', scriptureReference: 'Gen 1:1', excerpt: 'In the beginning...' },
  { id: 2, title: 'Day 2', date: '2026-03-21', scriptureReference: 'Gen 1:3', excerpt: 'Let there be light...' },
];

const mockPage1: PaginatedResult<DevotionalSummary> = {
  items: mockSummaries,
  totalCount: 4,
  page: 1,
  pageSize: 2,
  totalPages: 2,
  hasNextPage: true,
  hasPreviousPage: false,
};

const mockPage2: PaginatedResult<DevotionalSummary> = {
  items: [
    { id: 3, title: 'Day 3', date: '2026-03-22', scriptureReference: 'Gen 1:6', excerpt: 'The firmament...' },
    { id: 4, title: 'Day 4', date: '2026-03-23', scriptureReference: 'Gen 1:14', excerpt: 'Lights in the sky...' },
  ],
  totalCount: 4,
  page: 2,
  pageSize: 2,
  totalPages: 2,
  hasNextPage: false,
  hasPreviousPage: true,
};

describe('DevotionalArchiveContainerComponent', () => {
  let component: DevotionalArchiveContainerComponent;
  let fixture: ComponentFixture<DevotionalArchiveContainerComponent>;
  let devotionalServiceSpy: jasmine.SpyObj<DevotionalService>;

  function createComponent(): void {
    fixture = TestBed.createComponent(DevotionalArchiveContainerComponent);
    component = fixture.componentInstance;
  }

  beforeEach(async () => {
    devotionalServiceSpy = jasmine.createSpyObj('DevotionalService', ['getAll']);
    devotionalServiceSpy.getAll.and.returnValue(of(mockPage1));

    await TestBed.configureTestingModule({
      imports: [DevotionalArchiveContainerComponent],
      providers: [{ provide: DevotionalService, useValue: devotionalServiceSpy }],
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should call DevotionalService.getAll on init with page 1', () => {
    createComponent();
    fixture.detectChanges();

    expect(devotionalServiceSpy.getAll).toHaveBeenCalledWith(1, component.pageSize);
  });

  it('should set devotionals and clear loading after successful fetch', () => {
    createComponent();
    fixture.detectChanges();

    expect(component.devotionals()).toEqual(mockSummaries);
    expect(component.loading()).toBe(false);
    expect(component.hasNextPage()).toBe(true);
  });

  it('should render summary cards for each devotional', () => {
    createComponent();
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('gw-devotional-summary-card');
    expect(cards.length).toBe(2);
  });

  it('should show Load More button when hasNextPage is true', () => {
    createComponent();
    fixture.detectChanges();

    const loadMoreBtn = fixture.nativeElement.querySelector('.load-more-button');
    expect(loadMoreBtn).toBeTruthy();
    expect(loadMoreBtn.textContent).toContain('Load More');
  });

  it('should load next page and append items on Load More click', () => {
    devotionalServiceSpy.getAll.and.callFake((page: number) => {
      return of(page === 1 ? mockPage1 : mockPage2);
    });

    createComponent();
    fixture.detectChanges();

    expect(component.devotionals().length).toBe(2);

    component.loadMore();
    fixture.detectChanges();

    expect(devotionalServiceSpy.getAll).toHaveBeenCalledWith(2, component.pageSize);
    expect(component.devotionals().length).toBe(4);
    expect(component.hasNextPage()).toBe(false);
  });

  it('should hide Load More button when hasNextPage is false', () => {
    devotionalServiceSpy.getAll.and.returnValue(of({ ...mockPage1, hasNextPage: false }));

    createComponent();
    fixture.detectChanges();

    const loadMoreBtn = fixture.nativeElement.querySelector('.load-more-button');
    expect(loadMoreBtn).toBeFalsy();
  });

  it('should emit devotionalSelected when a card is clicked', () => {
    createComponent();
    fixture.detectChanges();

    const emitSpy = spyOn(component.devotionalSelected, 'emit');
    component.onCardClicked(42);

    expect(emitSpy).toHaveBeenCalledWith(42);
  });

  it('should display loading indicator before data arrives', () => {
    createComponent();
    expect(component.loading()).toBe(true);
  });

  it('should show error message on failure', () => {
    devotionalServiceSpy.getAll.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    createComponent();
    fixture.detectChanges();

    expect(component.error()).toBe('Unable to load devotionals. Please try again later.');
    expect(component.loading()).toBe(false);

    const errorEl = fixture.nativeElement.querySelector('.error-message');
    expect(errorEl).toBeTruthy();
  });
});
