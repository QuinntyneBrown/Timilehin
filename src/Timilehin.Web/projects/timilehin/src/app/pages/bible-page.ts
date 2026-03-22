import { Component } from '@angular/core';
import { BibleReaderContainerComponent } from 'domain';
import { NavbarComponent } from 'components';

@Component({
  selector: 'app-bible-page',
  standalone: true,
  imports: [BibleReaderContainerComponent],
  template: `<gw-bible-reader-container />`,
})
export class BiblePageComponent {}
