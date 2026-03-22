import { Component } from '@angular/core';
import { DevotionalPageContainerComponent } from 'domain';

@Component({
  selector: 'app-devotionals-page',
  standalone: true,
  imports: [DevotionalPageContainerComponent],
  template: `<gw-devotional-page-container />`,
})
export class DevotionalsPageComponent {}
