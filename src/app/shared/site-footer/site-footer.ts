import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DOCS_URL, SOCIAL_LINKS } from '../../core/socials';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
})
export class SiteFooterComponent {
  readonly year = new Date().getFullYear();
  readonly socials = SOCIAL_LINKS;
  readonly siteUrl = DOCS_URL;
}
