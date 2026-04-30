import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from './i18n.service';

/**
 * Composant sélecteur de langue FR/EN.
 * À placer dans la barre de navigation (app.html ou navbar.html).
 *
 * Usage :
 *   <app-lang-switcher />
 */
@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="lang-switcher">
      <button
        class="lang-btn"
        [class.active]="i18n.langue() === 'fr'"
        (click)="i18n.setLangue('fr')"
        title="Français"
      >FR</button>
      <span class="lang-sep">|</span>
      <button
        class="lang-btn"
        [class.active]="i18n.langue() === 'en'"
        (click)="i18n.setLangue('en')"
        title="English"
      >EN</button>
    </div>
  `,
  styles: [`
    .lang-switcher {
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .lang-btn {
      background: none;
      border: none;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--text-muted, #94a3b8);
      padding: 2px 6px;
      border-radius: 4px;
      transition: color 0.15s, background 0.15s;
    }
    .lang-btn:hover, .lang-btn.active {
      color: var(--accent, #3b82f6);
      background: var(--accent-light, #eff6ff);
    }
    .lang-sep {
      color: var(--border, #e2e8f0);
      font-size: 0.75rem;
    }
  `]
})
export class LangSwitcherComponent {
  i18n = inject(I18nService);
}
