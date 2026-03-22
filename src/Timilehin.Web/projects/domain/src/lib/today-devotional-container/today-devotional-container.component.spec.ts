import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { DevotionalDetail, DevotionalService } from 'api';
import { TodayDevotionalContainerComponent } from './today-devotional-container.component';

const mockDevotional: DevotionalDetail = {
  id: 1,
  title: 'Walking in Faith',
  date: '2026-03-22',
  scriptureReference: 'Hebrews 11:1',
  reflectionText: 'Faith is the substance of things hoped for.',
  prayerPrompt: 'Lord, strengthen my faith today.',
};

describe('TodayDevotionalContainerComponent', () => {
  let component: TodayDevotionalContainerComponent;
  let fixture: ComponentFixture<TodayDevotionalContainerComponent>;
  let devotionalServiceSpy: jasmine.SpyObj<DevotionalService>;

  function createComponent(): void {
    fixture = TestBed.createComponent(TodayDevotionalContainerComponent);
    component = fixture.componentInstance;
  }

  beforeEach(async () => {
    devotionalServiceSpy = jasmine.createSpyObj('DevotionalService', ['getToday']);
    devotionalServiceSpy.getToday.and.returnValue(of(mockDevotional));

    await TestBed.configureTestingModule({
      imports: [TodayDevotionalContainerComponent],
      providers: [{ provide: DevotionalService, useValue: devotionalServiceSpy }],
    }).compileComponents();
  });

  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should call DevotionalService.getToday on init', () => {
    createComponent();
    fixture.detectChanges();

    expect(devotionalServiceSpy.getToday).toHaveBeenCalledTimes(1);
  });

  it('should set devotional data and clear loading after successful fetch', () => {
    createComponent();
    fixture.detectChanges();

    expect(component.devotional()).toEqual(mockDevotional);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.notFound()).toBe(false);
  });

  it('should render the devotional card with correct inputs', () => {
    createComponent();
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('gw-devotional-card');
    expect(card).toBeTruthy();
  });

  it('should render the section label and date', () => {
    createComponent();
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('gw-section-label');
    expect(label).toBeTruthy();

    const dateEl = fixture.nativeElement.querySelector('.devotional-date');
    expect(dateEl).toBeTruthy();
    expect(dateEl.textContent).toContain('2026-03-22');
  });

  it('should display loading indicator before data arrives', () => {
    createComponent();
    expect(component.loading()).toBe(true);
  });

  it('should show no-devotional message on 404', () => {
    devotionalServiceSpy.getToday.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );

    createComponent();
    fixture.detectChanges();

    expect(component.notFound()).toBe(true);
    expect(component.loading()).toBe(false);

    const noDevotionalEl = fixture.nativeElement.querySelector('.no-devotional-message');
    expect(noDevotionalEl).toBeTruthy();
    expect(noDevotionalEl.textContent).toContain('No devotional for today');
  });

  it('should show generic error message on non-404 errors', () => {
    devotionalServiceSpy.getToday.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 }))
    );

    createComponent();
    fixture.detectChanges();

    expect(component.error()).toBe("Unable to load today's devotional. Please try again later.");
    expect(component.loading()).toBe(false);
    expect(component.devotional()).toBeNull();

    const errorEl = fixture.nativeElement.querySelector('.error-message');
    expect(errorEl).toBeTruthy();
  });
});
