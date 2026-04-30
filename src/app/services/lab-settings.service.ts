import { ThemeService } from './theme.service';
import { Injectable, signal, computed, effect } from '@angular/core';
import { ApiService } from './api.service';

type ThemeKey = 'dark' | 'light';

interface ThemePalette {
  bgPrimary?: string;
  bgSecondary?: string;
  bgCard?: string;
  bgInput?: string;
  bgSidebar?: string;
  bgModal?: string;
  bgTableHead?: string;
  bgTableRow?: string;
  bgTableHover?: string;
  bgNavbar?: string;
  textPrimary?: string;
  textSecondary?: string;
  textMuted?: string;
  textHeading?: string;
  textBody?: string;
  textPlaceholder?: string;
  borderColor?: string;
  borderSubtle?: string;
  accent?: string;
  accentHover?: string;
  success?: string;
  warning?: string;
  danger?: string;
}

@Injectable({ providedIn: 'root' })
export class LabSettingsService {
  nom = signal('LIMTIC');
  acronyme = signal('LIMTIC');
  description = signal(
    "Laboratoire d'Informatique, de Modelisation et des Technologies de l'Information et de la Communication"
  );
  email = signal('contact@limtic.tn');
  telephone = signal('');
  adresse = signal('');
  logoLightUrl = signal('');
  logoDarkUrl = signal('');

  seoData = signal<Record<string, { titre: string; description: string; motsCles: string }>>({});

  private loaded = false;
  private themeColors: Record<ThemeKey, ThemePalette> = { dark: {}, light: {} };

  private readonly THEME_VAR_MAP: Record<keyof ThemePalette, string> = {
    bgPrimary: '--bg-primary',
    bgSecondary: '--bg-secondary',
    bgCard: '--bg-card',
    bgInput: '--bg-input',
    bgSidebar: '--bg-sidebar',
    bgModal: '--bg-modal',
    bgTableHead: '--bg-table-head',
    bgTableRow: '--bg-table-row',
    bgTableHover: '--bg-table-hover',
    bgNavbar: '--bg-navbar',
    textPrimary: '--text-primary',
    textSecondary: '--text-secondary',
    textMuted: '--text-muted',
    textHeading: '--text-heading',
    textBody: '--text-body',
    textPlaceholder: '--text-placeholder',
    borderColor: '--border-color',
    borderSubtle: '--border-subtle',
    accent: '--accent',
    accentHover: '--accent-hover',
    success: '--success',
    warning: '--warning',
    danger: '--danger'
  };


  // Inject ThemeService here
  constructor(
    private api: ApiService,
    private themeService: ThemeService 
  ) {
    effect(() => {
      const currentTheme = this.themeService.theme();
      this.applyThemeColors(currentTheme);
    });
  }

  loadPublic(): void {
    if (this.loaded) return;
    this.loaded = true;
    this.fetchPublic();
  }

  refresh(): void {
    this.loaded = false;
    this.fetchPublic();
  }

  /**
   * Computed signal — se recalcule automatiquement quand logoLightUrl(), logoDarkUrl() ou theme() change.
   * Retourne l'URL résolue du logo :
   *   - Aucun logo en base → logo par défaut selon le thème actif (dark/light)
   *   - URL absolue (http/https) → retournée telle quelle
   *   - Chemin relatif /uploads/ → préfixé par l'URL du backend
   *   - Autre chemin absolu → retourné tel quel
   */
  logoUrlResolved = computed<string>(() => {
    const currentTheme = this.themeService.theme();
    const primary = currentTheme === 'light' ? this.logoLightUrl() : this.logoDarkUrl();
    const fallback = currentTheme === 'light' ? this.logoDarkUrl() : this.logoLightUrl();
    const raw = primary || fallback;

    // Aucun logo configuré en base (ou valeur par défaut /assets/) → logo statique
    const hasNoCustomLogo = !raw || raw.trim() === '' || raw.startsWith('/assets/');
    if (hasNoCustomLogo) {
      return currentTheme === 'light' ? '/limtic-light.png' : '/limtic-dark.png';
    }

    if (raw.startsWith('http'))      return raw;
    if (raw.startsWith('/uploads/')) return this.api.getLogoUrl(raw);
    return raw;
  });

  private fetchPublic(): void {
    this.api.getParametresPublics().subscribe({
      next: (params: any[]) => {
        const get = (cle: string) => params.find(p => p.cle === cle)?.valeur ?? '';
        
        // Update signals
        this.nom.set(get('labo.nom') || 'LIMTIC');
        this.acronyme.set(get('labo.acronyme') || 'LIMTIC');
        this.description.set(get('labo.description') || "Laboratoire d'Informatique...");
        this.email.set(get('labo.email') || 'contact@limtic.tn');
        this.telephone.set(get('labo.telephone'));
        this.adresse.set(get('labo.adresse'));
        this.logoLightUrl.set(get('labo.logoUrlLight'));
        this.logoDarkUrl.set(get('labo.logoUrlDark'));

        const newSeoData: Record<string, { titre: string; description: string; motsCles: string }> = {};
        const seoKeys = ['home', 'chercheurs', 'publications', 'evenements', 'axes', 'doctorants', 'masteriens', 'directeur', 'contact', 'outils'];
        for (const k of seoKeys) {
          newSeoData[k] = {
            titre: get(`seo.${k}.titre`),
            description: get(`seo.${k}.description`),
            motsCles: get(`seo.${k}.motsCles`)
          };
        }
        this.seoData.set(newSeoData);

        this.themeColors = {
          dark: this.readThemePalette(get, 'theme.dark'),
          light: this.readThemePalette(get, 'theme.light')
        };

        this.applyThemeColors(this.themeService.theme());
      },
      error: (err) => console.error('Could not load lab settings', err)
    });
  }

  private readThemePalette(get: (key: string) => string, prefix: string): ThemePalette {
    return {
      bgPrimary: get(`${prefix}.bgPrimary`),
      bgSecondary: get(`${prefix}.bgSecondary`),
      bgCard: get(`${prefix}.bgCard`),
      bgInput: get(`${prefix}.bgInput`),
      bgSidebar: get(`${prefix}.bgSidebar`),
      bgModal: get(`${prefix}.bgModal`),
      bgTableHead: get(`${prefix}.bgTableHead`),
      bgTableRow: get(`${prefix}.bgTableRow`),
      bgTableHover: get(`${prefix}.bgTableHover`),
      bgNavbar: get(`${prefix}.bgNavbar`),
      textPrimary: get(`${prefix}.textPrimary`),
      textSecondary: get(`${prefix}.textSecondary`),
      textMuted: get(`${prefix}.textMuted`),
      textHeading: get(`${prefix}.textHeading`),
      textBody: get(`${prefix}.textBody`),
      textPlaceholder: get(`${prefix}.textPlaceholder`),
      borderColor: get(`${prefix}.borderColor`),
      borderSubtle: get(`${prefix}.borderSubtle`),
      accent: get(`${prefix}.accent`),
      accentHover: get(`${prefix}.accentHover`),
      success: get(`${prefix}.success`),
      warning: get(`${prefix}.warning`),
      danger: get(`${prefix}.danger`)
    };
  }

  private applyThemeColors(themeKey: ThemeKey): void {
    const colors = this.themeColors[themeKey];
    const hasAny = Object.values(colors).some(v => !!v);
    if (!hasAny) return;

    const root = document.documentElement;
    const body = document.body;

    const setVar = (name: string, value: string | null) => {
      if (!value) return;
      root.style.setProperty(name, value);
      body?.style.setProperty(name, value);
    };

    const normalizeHex = (value: string): string | null => {
      const v = value.trim();
      if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return null;
      if (v.length === 4) {
        const r = v[1];
        const g = v[2];
        const b = v[3];
        return `#${r}${r}${g}${g}${b}${b}`;
      }
      return v;
    };

    const toRgba = (hex: string, alpha: number): string | null => {
      const norm = normalizeHex(hex);
      if (!norm) return null;
      const r = parseInt(norm.slice(1, 3), 16);
      const g = parseInt(norm.slice(3, 5), 16);
      const b = parseInt(norm.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    };

    (Object.keys(this.THEME_VAR_MAP) as (keyof ThemePalette)[]).forEach((key) => {
      const value = colors[key];
      if (!value) return;
      setVar(this.THEME_VAR_MAP[key], value);
    });

    const accentSoft = colors.accent ? toRgba(colors.accent, 0.1) : null;
    const dangerSoft = colors.danger ? toRgba(colors.danger, 0.12) : null;
    const successSoft = colors.success ? toRgba(colors.success, 0.1) : null;
    const warningSoft = colors.warning ? toRgba(colors.warning, 0.1) : null;

    setVar('--accent-soft', accentSoft);
    setVar('--danger-soft', dangerSoft);
    setVar('--success-soft', successSoft);
    setVar('--warning-soft', warningSoft);
  }
}