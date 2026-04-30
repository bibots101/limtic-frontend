import { Injectable, effect, signal } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { LabSettingsService } from './lab-settings.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private currentKey = signal<string>('home');

  constructor(
    private title: Title,
    private meta: Meta,
    private settings: LabSettingsService,
    private router: Router
  ) {
    // Listen to router to update current key
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      this.updateKeyFromUrl(e.urlAfterRedirects);
    });

    // React to settings load/refresh or route change
    effect(() => {
      const dataMap = this.settings.seoData();
      const key = this.currentKey();
      const pageData = dataMap[key];
      const labName = this.settings.nom();
      const labAcr = this.settings.acronyme() || 'LIMTIC';
      const labDesc = this.settings.description();

      if (pageData) {
        if (pageData.titre) {
          this.title.setTitle(`${pageData.titre} | ${labAcr}`);
        } else {
          this.title.setTitle(labName);
        }

        if (pageData.description) {
          this.meta.updateTag({ name: 'description', content: pageData.description });
        } else {
          this.meta.updateTag({ name: 'description', content: labDesc });
        }

        if (pageData.motsCles) {
          this.meta.updateTag({ name: 'keywords', content: pageData.motsCles });
        } else {
          this.meta.removeTag("name='keywords'");
        }
      } else {
        this.title.setTitle(labName);
        this.meta.updateTag({ name: 'description', content: labDesc });
        this.meta.removeTag("name='keywords'");
      }
    });
  }

  private updateKeyFromUrl(url: string) {
    // Remove query params or fragments
    const cleanUrl = url.split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/').filter(s => s.length > 0);
    
    let key = 'home';
    if (segments.length > 0) {
      key = segments[0].toLowerCase();
    }
    
    this.currentKey.set(key);
  }
}
