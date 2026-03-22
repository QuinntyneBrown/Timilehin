import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { HomepageContainerComponent } from './homepage-container.component';

// Stub child components to isolate the unit under test
@Component({ selector: 'gw-hero', standalone: true, template: '' })
class HeroStubComponent {}

@Component({ selector: 'gw-feature-card', standalone: true, template: '' })
class FeatureCardStubComponent {}

@Component({ selector: 'gw-footer', standalone: true, template: '' })
class FooterStubComponent {}

@Component({
  selector: 'gw-verse-of-the-day-container',
  standalone: true,
  template: '',
})
class VerseOfTheDayContainerStubComponent {}

describe('HomepageContainerComponent', () => {
  let component: HomepageContainerComponent;
  let fixture: ComponentFixture<HomepageContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomepageContainerComponent],
    })
      .overrideComponent(HomepageContainerComponent, {
        remove: {
          imports: [],
        },
        add: {
          imports: [
            HeroStubComponent,
            FeatureCardStubComponent,
            FooterStubComponent,
            VerseOfTheDayContainerStubComponent,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(HomepageContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the hero component', () => {
    const hero = fixture.debugElement.query(By.css('gw-hero'));
    expect(hero).toBeTruthy();
  });

  it('should render the verse-of-the-day container', () => {
    const votd = fixture.debugElement.query(
      By.css('gw-verse-of-the-day-container')
    );
    expect(votd).toBeTruthy();
  });

  it('should render two feature cards', () => {
    const cards = fixture.debugElement.queryAll(By.css('gw-feature-card'));
    expect(cards.length).toBe(2);
  });

  it('should render the footer component', () => {
    const footer = fixture.debugElement.query(By.css('gw-footer'));
    expect(footer).toBeTruthy();
  });

  it('should emit navigated with /bible when primary CTA is clicked', () => {
    const spy = vi.fn();
    component.navigated.subscribe(spy);

    component.onPrimaryClicked();

    expect(spy).toHaveBeenCalledWith('/bible');
  });

  it('should emit navigated with /devotionals when secondary CTA is clicked', () => {
    const spy = vi.fn();
    component.navigated.subscribe(spy);

    component.onSecondaryClicked();

    expect(spy).toHaveBeenCalledWith('/devotionals');
  });

  it('should emit navigated with /bible when Bible feature card link is clicked', () => {
    const spy = vi.fn();
    component.navigated.subscribe(spy);

    component.onBibleCardClicked();

    expect(spy).toHaveBeenCalledWith('/bible');
  });

  it('should emit navigated with /devotionals when Devotional feature card link is clicked', () => {
    const spy = vi.fn();
    component.navigated.subscribe(spy);

    component.onDevotionalCardClicked();

    expect(spy).toHaveBeenCalledWith('/devotionals');
  });

  it('should emit navigated with footer link url when footer link is clicked', () => {
    const spy = vi.fn();
    component.navigated.subscribe(spy);

    component.onFooterLinkClicked({ label: 'Privacy Policy', url: '/privacy' });

    expect(spy).toHaveBeenCalledWith('/privacy');
  });
});
