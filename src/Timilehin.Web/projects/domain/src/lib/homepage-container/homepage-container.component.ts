import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import {
  FeatureCardComponent,
  FooterComponent,
  FooterLink,
  HeroComponent,
} from 'components';
import { VerseOfTheDayContainerComponent } from '../verse-of-the-day-container/verse-of-the-day-container.component';

@Component({
  selector: 'gw-homepage-container',
  standalone: true,
  imports: [
    HeroComponent,
    FeatureCardComponent,
    FooterComponent,
    VerseOfTheDayContainerComponent,
  ],
  templateUrl: './homepage-container.component.html',
  styleUrl: './homepage-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomepageContainerComponent {
  readonly navigated = output<string>();

  readonly footerLinks: FooterLink[] = [
    { label: 'Privacy Policy', url: '/privacy' },
    { label: 'Terms of Service', url: '/terms' },
    { label: 'Contact', url: '/contact' },
  ];

  onPrimaryClicked(): void {
    this.navigated.emit('/bible');
  }

  onSecondaryClicked(): void {
    this.navigated.emit('/devotionals');
  }

  onBibleCardClicked(): void {
    this.navigated.emit('/bible');
  }

  onDevotionalCardClicked(): void {
    this.navigated.emit('/devotionals');
  }

  onFooterLinkClicked(link: FooterLink): void {
    this.navigated.emit(link.url);
  }
}
