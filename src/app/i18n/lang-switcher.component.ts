import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { I18nService } from './i18n.service';

/**
 * Composant sélecteur de langue FR/EN.
 *
 * Deux variantes :
 *   <app-lang-switcher />               → pill FR | EN (navbar desktop / mobile)
 *   <app-lang-switcher mode="dropdown" /> → ligne dans un dropdown menu
 */
@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- ── Mode pill (défaut) : FR | EN côte à côte ── -->
    @if (mode !== 'dropdown') {
      <div class="lang-pill">
        <button
          class="lang-pill-btn"
          [class.lang-active]="i18n.langue() === 'fr'"
          (click)="i18n.setLangue('fr')"
          title="Français"
        >FR</button>
        <span class="lang-sep">|</span>
        <button
          class="lang-pill-btn"
          [class.lang-active]="i18n.langue() === 'en'"
          (click)="i18n.setLangue('en')"
          title="English"
        >EN</button>
      </div>
    }

    <!-- ── Mode dropdown : ligne cliquable dans un menu ── -->
    @if (mode === 'dropdown') {
      <div class="lang-dropdown-row">
        <span class="dd-icon">🌐</span>
        <span class="lang-dropdown-label">Langue / Language</span>
        <div class="lang-pill lang-pill-compact">
          <button
            class="lang-pill-btn"
            [class.lang-active]="i18n.langue() === 'fr'"
            (click)="i18n.setLangue('fr'); $event.stopPropagation()"
            title="Français"
          >FR</button>
          <span class="lang-sep">|</span>
          <button
            class="lang-pill-btn"
            [class.lang-active]="i18n.langue() === 'en'"
            (click)="i18n.setLangue('en'); $event.stopPropagation()"
            title="English"
          >EN</button>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ── Pill ──────────────────────────────────────────── */
    .lang-pill {
      display: flex;
      align-items: center;
      gap: 2px;
      background: var(--bg-card, rgba(255,255,255,0.06));
      border: 1px solid var(--border-color, rgba(255,255,255,0.12));
      border-radius: 20px;
      padding: 3px 8px;
    }

    .lang-pill-compact {
      padding: 2px 6px;
      background: var(--bg-secondary, rgba(255,255,255,0.04));
      border-color: var(--border-subtle, rgba(255,255,255,0.08));
    }

    .lang-pill-btn {
      background: none;
      border: none;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      color: var(--text-muted, #94a3b8);
      padding: 2px 5px;
      border-radius: 12px;
      transition: color 0.15s, background 0.15s;
      line-height: 1;
    }

    .lang-pill-btn:hover {
      color: var(--accent, #00d2ff);
    }

    .lang-pill-btn.lang-active {
      color: var(--accent, #00d2ff);
      background: var(--accent-soft, rgba(0,210,255,0.12));
    }

    .lang-sep {
      color: var(--border-color, rgba(255,255,255,0.2));
      font-size: 0.7rem;
      user-select: none;
    }

    /* ── Dropdown row ──────────────────────────────────── */
    .lang-dropdown-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary, #94a3b8);
      cursor: default;
      transition: background 0.2s;
    }

    .lang-dropdown-row:hover {
      background: var(--accent-soft, rgba(0,210,255,0.06));
    }

    .lang-dropdown-label {
      flex: 1;
      font-size: 0.875rem;
      color: var(--text-secondary, #94a3b8);
    }
  `]
})
export class LangSwitcherComponent {
  /** 'pill' (default) | 'dropdown' */
  @Input() mode: 'pill' | 'dropdown' = 'pill';
  i18n = inject(I18nService);
}
