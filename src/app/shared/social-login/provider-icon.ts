import { Component, input } from '@angular/core';

import { SocialProviderId } from '../../core/models/platform';

/** One-colour provider mark that follows the button's text colour. */
@Component({
  selector: 'app-provider-icon',
  template: `
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      @if (provider() === 'github') {
        <path
          fill="currentColor"
          d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"
        />
      } @else {
        <path
          fill="currentColor"
          d="M21.6 12.23c0-.68-.06-1.36-.18-2.02H12v3.83h5.4a4.62 4.62 0 0 1-2 3.03v2.5h3.24c1.9-1.75 2.96-4.32 2.96-7.34ZM12 22c2.7 0 4.98-.9 6.64-2.43l-3.24-2.5c-.9.6-2.05.95-3.4.95-2.6 0-4.82-1.76-5.6-4.13H3.06v2.58A10 10 0 0 0 12 22ZM6.4 13.89a6 6 0 0 1 0-3.78V7.53H3.06a10 10 0 0 0 0 8.94l3.34-2.58ZM12 5.98c1.47 0 2.8.5 3.84 1.5l2.88-2.88A9.66 9.66 0 0 0 12 2a10 10 0 0 0-8.94 5.53l3.34 2.58C7.18 7.74 9.4 5.98 12 5.98Z"
        />
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      vertical-align: middle;
      margin-right: 0.4rem;
    }
  `,
})
export class ProviderIcon {
  readonly provider = input.required<SocialProviderId>();
}
