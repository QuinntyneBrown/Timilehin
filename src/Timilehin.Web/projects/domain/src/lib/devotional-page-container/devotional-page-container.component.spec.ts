import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DevotionalDetail, DevotionalService, PaginatedResult, DevotionalSummary } from 'api';
import { DevotionalPageContainerComponent } from './devotional-page-container.component';

const mockDevotional: DevotionalDetail = {
  id: 1,
  title: 'Walking in Faith',
  date: '2026-03-22',
  scriptureReference: 'Hebrews 11:1',
  reflectionText: 'Faith is the substance of things hoped for.',
  prayerPrompt: 'Lord, strengthen my faith today.',
};

const mockPaginatedResult: PaginatedResult<DevotionalSummary> = {
  items: [
    { id: 1, title: 'Day 1', date: '2026-03-20', scriptureReference: 'Gen 1:1', excerpt: 'In the beginning...' },
  ],
  totalCount: 1,
  page: 1,
  pageSize: 10,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

describe('DevotionalPageContainerComponent', () => {
  let component: DevotionalPageContainerComponent;
  let fixture: ComponentFixture<DevotionalPageContainerComponent>;
  let devotionalServiceSpy: jasmine.SpyObj<DevotionalService>;

  function createComponent(): void {
    fixture = TestBed.createComponent(DevotionalPageContainerComponent);
    component = fixture.componentInstance;
  }

  beforeEach(async () => {
    devotionalServiceSpy = jasmine.createSpyObj('DevotionalService', ['getToday', 'getAll', 'getById']);
    devotionalServiceSpy.getToday.and.returnValue(of(mockDevotional));
    devotionalServiceSpy.getAll.and.returnValue(of(mockPaginatedResult));
    devotionalServiceSpy.getById.and.returnValue(of(mockDevotional));

    await TestBed.configureTestingModule({
      imports: [DevotionalPageContainerComponent],
      providers: [{ provide: DevotionalService, useValue: devotionalServiceSpy }],
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should contain the today devotional container in the template', () => {
    createComponent();
    fixture.detectChanges();

    const todayContainer = fixture.nativeElement.querySelector('gw-today-devotional-container');
    expect(todayContainer).toBeTruthy();
  });

  it('should contain the devotional archive container in the template', () => {
    createComponent();
    fixture.detectChanges();

    const archiveContainer = fixture.nativeElement.querySelector('gw-devotional-archive-container');
    expect(archiveContainer).toBeTruthy();
  });

  it('should have a two-column layout', () => {
    createComponent();
    fixture.detectChanges();

    const layout = fixture.nativeElement.querySelector('.devotional-page-layout');
    expect(layout).toBeTruthy();

    const columnToday = fixture.nativeElement.querySelector('.column-today');
    const columnArchive = fixture.nativeElement.querySelector('.column-archive');
    expect(columnToday).toBeTruthy();
    expect(columnArchive).toBeTruthy();
  });

  it('should emit devotionalSelected and fetch detail when onDevotionalSelected is called', () => {
    createComponent();
    fixture.detectChanges();

    const emitSpy = spyOn(component.devotionalSelected, 'emit');
    component.onDevotionalSelected(1);

    expect(emitSpy).toHaveBeenCalledWith(1);
    expect(devotionalServiceSpy.getById).toHaveBeenCalledWith(1);
    expect(component.selectedDevotional()).toEqual(mockDevotional);
    expect(component.selectedLoading()).toBe(false);
  });

  it('should show selected devotional card after fetching detail', () => {
    createComponent();
    fixture.detectChanges();

    component.onDevotionalSelected(1);
    fixture.detectChanges();

    const selectedCard = fixture.nativeElement.querySelector('.selected-devotional gw-devotional-card');
    expect(selectedCard).toBeTruthy();
  });

  it('should show error when selected devotional fetch fails', () => {
    devotionalServiceSpy.getById.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    createComponent();
    fixture.detectChanges();

    component.onDevotionalSelected(99);
    fixture.detectChanges();

    expect(component.selectedError()).toBe('Unable to load the devotional. Please try again later.');
    expect(component.selectedLoading()).toBe(false);

    const errorEl = fixture.nativeElement.querySelector('.error-message');
    expect(errorEl).toBeTruthy();
  });

  it('should show not-found error when selected devotional returns 404', () => {
    devotionalServiceSpy.getById.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );

    createComponent();
    fixture.detectChanges();

    component.onDevotionalSelected(99);

    expect(component.selectedError()).toBe('Devotional not found.');
    expect(component.selectedLoading()).toBe(false);
  });
});
