import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';
import { ThemeService } from '../../services/theme.service';
import { LabSettingsService } from '../../services/lab-settings.service';
import { SafePipe } from '../../pipes/Safepipe';
import { AdminEvenementsComponent } from '../admin-evenements/admin-evenements.component';

// ── Types internes pour §4.3.6 ────────────────────────────────────────────────

/** Valeurs du formulaire "Identité du laboratoire" */
interface LaboForm {
  nom:        string;
  acronyme:   string;
  description: string;
  email:      string;
  telephone:  string;
  adresse:    string;
}

type ThemeKey = 'dark' | 'light';

/** Valeurs du formulaire "Couleurs du thème" */
interface ThemePalette {
  bgPrimary: string;
  bgSecondary: string;
  bgCard: string;
  bgInput: string;
  bgSidebar: string;
  bgModal: string;
  bgTableHead: string;
  bgTableRow: string;
  bgTableHover: string;
  bgNavbar: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textHeading: string;
  textBody: string;
  textPlaceholder: string;
  borderColor: string;
  borderSubtle: string;
  accent: string;
  accentHover: string;
  success: string;
  warning: string;
  danger: string;
}

type ThemeForm = Record<ThemeKey, ThemePalette>;

/** Valeurs du formulaire "Parametres SMTP" */
interface SmtpForm {
  host: string;
  port: string;
  username: string;
  destinataire: string;
  password: string;
}

/** Métadonnées SEO pour une page */
interface SeoPageForm {
  titre:       string;
  description: string;
  motsCles:    string;
}

/** Map page-clé → métadonnées SEO */
type SeoForm = Record<string, SeoPageForm>;

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminEvenementsComponent],
  templateUrl: './dashboard-admin.html',
  styleUrls: ['./dashboard-admin.css']
})
export class DashboardAdmin implements OnInit {

  email     = signal('');
  userRole  = signal('');
  activeTab = signal('dashboard');

  stats = signal({ chercheurs: 0, publications: 0, evenements: 0, outils: 0, axes: 0, users: 0, doctorants: 0, masteriens: 0 });
  chercheurs   = signal<any[]>([]);
  publications = signal<any[]>([]);
  evenements   = signal<any[]>([]);
  users        = signal<any[]>([]);
  doctorants   = signal<any[]>([]);
  masteriens   = signal<any[]>([]);
  axes         = signal<any[]>([]);
  editingAxe   = signal<any | null>(null);
  assocMap     = signal<Record<number, number | null>>({});

  publicationsEnAttente = computed(() =>
    this.publications().filter(p => p.statut === 'SOUMIS')
  );

  newAxe       = { nom: '', description: '', responsableId: null as number | null };
  newEvent     = { titre: '', type: 'Séminaire', dateEvenement: '', lieu: '', description: '' };
  newUser      = { email: '', motDePasse: '', role: 'CHERCHEUR' };
  newDoctorant = { nom: '', prenom: '', sujetThese: '', directeurId: null as number | null, dateInscription: '', statut: 'EN_COURS', mention: '', photoUrl: '' };
  newMasterien = { nom: '', prenom: '', sujetMemoire: '', encadrantId: null as number | null, promotion: '', statut: 'EN_COURS' };
  newPub: {
    titre: string; type: string; annee: number; journal: string; resume: string;
    statut: string; doi: string; pdfUrl: string; lienUrl: string; motsCles: string;
    scimagoQuartile: string; classementCORE: string;
    facteurImpact: number | null; snip: number | null;
    sourceClassement: string;
  } = {
    titre: '', type: 'Journal', annee: new Date().getFullYear(), journal: '',
    resume: '', statut: 'PUBLIE', doi: '', pdfUrl: '', lienUrl: '', motsCles: '',
    scimagoQuartile: '', classementCORE: '',
    facteurImpact: null, snip: null, sourceClassement: ''
  };
  newPubPdfFile: File | null = null;
  newPubPdfPreviewUrl: SafeResourceUrl | null = null;
  editingDoctorant    = signal<any | null>(null);
  editingMasterien    = signal<any | null>(null);
  editingPublication  = signal<any | null>(null);

  editPubPdfFile: File | null = null;
  editPubPdfPreviewUrl: SafeResourceUrl | null = null;
  private _editPdfBlobUrl: string | null = null;
  get editPdfBlobUrl(): string | null { return this._editPdfBlobUrl; }
  editPdfViewerUrl = signal<SafeResourceUrl | null>(null);
  editRemovePdf = false;
  private _editExistingPdfSafeUrl: SafeResourceUrl | null = null;
  private _editExistingPdfBlobUrl: string | null = null;
  get editExistingPdfBlobUrl(): string | null { return this._editExistingPdfBlobUrl; }

  showForm = signal('');
  message  = signal('');
  erreur   = signal('');

  csvFile = signal<File | null>(null);
  csvImportReport = signal<{ importes: number; ignores: number; erreurs: string[] } | null>(null);

  // ── §4.3.6 — Paramètres généraux ────────────────────────────────────────

  /** Formulaire identité labo */
  laboForm: LaboForm = {
    nom:         '',
    acronyme:    '',
    description: '',
    email:       '',
    telephone:   '',
    adresse:     '',
  };

  private readonly THEME_DEFAULTS: ThemeForm = {
    dark: {
      bgPrimary: '#111827',
      bgSecondary: '#1a2234',
      bgCard: '#1f2937',
      bgInput: '#252840',
      bgSidebar: '#1e293b',
      bgModal: '#1f2937',
      bgTableHead: '#1a2234',
      bgTableRow: '#1f2937',
      bgTableHover: '#252840',
      bgNavbar: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
      textPrimary: '#ffffff',
      textSecondary: '#d1d5db',
      textMuted: 'rgba(255,255,255,0.4)',
      textHeading: '#ffffff',
      textBody: '#d1d5db',
      textPlaceholder: 'rgba(255,255,255,0.4)',
      borderColor: 'rgba(0,210,255,0.15)',
      borderSubtle: 'rgba(255,255,255,0.05)',
      accent: '#00d2ff',
      accentHover: '#00a8cc',
      success: '#34d399',
      warning: '#f59e0b',
      danger: '#f87171'
    },
    light: {
      bgPrimary: '#f2f3f7',
      bgSecondary: '#ffffff',
      bgCard: '#ffffff',
      bgInput: '#f2f3f7',
      bgSidebar: '#f8fafc',
      bgModal: '#ffffff',
      bgTableHead: '#dde1ef',
      bgTableRow: '#ffffff',
      bgTableHover: '#e4e7f2',
      bgNavbar: 'linear-gradient(135deg, #f2f3f7, #f7f8fc, #ffffff)',
      textPrimary: '#0a0c18',
      textSecondary: '#1a1d2e',
      textMuted: '#5c637a',
      textHeading: '#0a0c18',
      textBody: '#2d3152',
      textPlaceholder: '#9ba3c0',
      borderColor: '#d9dce8',
      borderSubtle: '#d8dceb',
      accent: '#4338ca',
      accentHover: '#3730a3',
      success: '#15803d',
      warning: '#b45309',
      danger: '#b91c1c'
    }
  };

  /** Formulaire couleurs du thème */
  themeForm: ThemeForm = {
    dark: { ...this.THEME_DEFAULTS.dark },
    light: { ...this.THEME_DEFAULTS.light }
  };

  readonly THEME_SECTIONS: { key: ThemeKey; label: string; description: string }[] = [
    { key: 'dark', label: 'Thème sombre', description: 'Couleurs utilisées quand le site est en mode sombre.' },
    { key: 'light', label: 'Thème clair', description: 'Couleurs utilisées quand le site est en mode clair.' }
  ];

  readonly THEME_FIELDS: { key: keyof ThemePalette; label: string; hint: string }[] = [
    { key: 'bgPrimary', label: 'Fond principal', hint: 'Page globale' },
    { key: 'bgSecondary', label: 'Fond secondaire', hint: 'Sections' },
    { key: 'bgCard', label: 'Fond des cartes', hint: 'Cartes et blocs' },
    { key: 'bgInput', label: 'Fond des champs', hint: 'Inputs et selects' },
    { key: 'bgSidebar', label: 'Fond sidebar', hint: 'Menus latéraux' },
    { key: 'bgModal', label: 'Fond modales', hint: 'Fenêtres modales' },
    { key: 'bgTableHead', label: 'Table - en-tête', hint: 'Ligne d’en-tête' },
    { key: 'bgTableRow', label: 'Table - lignes', hint: 'Lignes normales' },
    { key: 'bgTableHover', label: 'Table - survol', hint: 'Ligne au survol' },
    { key: 'bgNavbar', label: 'Fond navbar', hint: 'Barre de navigation' },
    { key: 'textPrimary', label: 'Texte principal', hint: 'Titres, contenu' },
    { key: 'textSecondary', label: 'Texte secondaire', hint: 'Descriptions' },
    { key: 'textMuted', label: 'Texte atténué', hint: 'Indications' },
    { key: 'textHeading', label: 'Texte des titres', hint: 'H1/H2' },
    { key: 'textBody', label: 'Texte corps', hint: 'Paragraphes' },
    { key: 'textPlaceholder', label: 'Placeholder', hint: 'Champs vides' },
    { key: 'borderColor', label: 'Bordures', hint: 'Bordures principales' },
    { key: 'borderSubtle', label: 'Bordures subtiles', hint: 'Séparateurs' },
    { key: 'accent', label: 'Accent principal', hint: 'Boutons, liens' },
    { key: 'accentHover', label: 'Accent hover', hint: 'Survols' },
    { key: 'success', label: 'Succès', hint: 'Confirmations' },
    { key: 'warning', label: 'Avertissement', hint: 'Alertes' },
    { key: 'danger', label: 'Danger', hint: 'Suppression' }
  ];

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

  /** Formulaire SMTP */
  smtpForm: SmtpForm = {
    host: '',
    port: '',
    username: '',
    destinataire: '',
    password: ''
  };

  /** Pages publiques pour lesquelles on peut configurer le SEO */
  readonly SEO_PAGES: { key: string; label: string; icon: string }[] = [
    { key: 'home',         label: 'Accueil',            icon: '🏠' },
    { key: 'chercheurs',   label: 'Chercheurs',         icon: '👥' },
    { key: 'publications', label: 'Publications',       icon: '📄' },
    { key: 'evenements',   label: 'Événements',         icon: '📅' },
    { key: 'axes',         label: 'Axes de recherche',  icon: '🔬' },
    { key: 'doctorants',   label: 'Doctorants',         icon: '🎓' },
    { key: 'masteriens',   label: 'Mastériens',         icon: '📚' },
    { key: 'directeur',    label: 'Mot du directeur',   icon: '🏛' },
    { key: 'contact',      label: 'Contact',            icon: '✉️' },
    { key: 'outils',       label: 'Outils & logiciels', icon: '🛠' },
  ];

  /** Formulaire SEO indexé par clé de page */
  seoForm: SeoForm = Object.fromEntries(
    ['home','chercheurs','publications','evenements','axes',
     'doctorants','masteriens','directeur','contact','outils']
      .map(k => [k, { titre: '', description: '', motsCles: '' }])
  );

  /** Page SEO actuellement ouverte dans l'accordéon */
  seoPageActive = signal<string>('home');

  /** Section de paramètres actuellement ouverte dans l'accordéon */
  activeParamsSection = signal<string>('identite');

  /** URL courante du logo (relative, ex: /uploads/logos/logo-abc.png) */
  logoUrlCouranteLight = signal<string>('');
  logoUrlCouranteDark = signal<string>('');

  /** Prévisualisation locale du logo avant upload */
  logoPreviewUrlLight = signal<string>('');
  logoPreviewUrlDark = signal<string>('');

  /** Fichier logo sélectionné en attente d'upload */
  logoLightFile: File | null = null;
  logoDarkFile: File | null = null;

  /** Indique si le logo doit être supprimé */
  logoLightDeleted = signal(false);
  logoDarkDeleted = signal(false);

  /** Section paramètres ouverte */
  paramSectionActive = signal<string>('identite');

  /** Indicateur de sauvegarde en cours */
  parametresSaving = signal(false);

  /** Indicateur de chargement initial des paramètres */
  parametresLoading = signal(false);

  // ─────────────────────────────────────────────────────────────────────────

  constructor(
    private router: Router,
    private api: ApiService,
    private sanitizer: DomSanitizer,
    public themeService: ThemeService,
    public settings: LabSettingsService
  ) {
    effect(() => {
      const currentTheme = this.themeService.theme();
      this.appliquerCouleursTheme(currentTheme, this.themeForm[currentTheme]);
    });
  }

  private handleError(error: any) {
    const message = error?.error?.message || error?.message || error?.statusText || 'Erreur backend';
    this.message.set('');
    this.erreur.set('Erreur : ' + message);
  }

  toggleParamSection(key: string) {
    this.paramSectionActive.set(this.paramSectionActive() === key ? '' : key);
  }

  ngOnInit() {
    const role = localStorage.getItem('role');
    if (!role || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      this.router.navigate(['/login']);
      return;
    }
    this.userRole.set(role);
    this.email.set(localStorage.getItem('email') || '');
    this.loadAll();
  }

  loadAll() {
    this.api.getChercheurs().subscribe(data => {
      this.chercheurs.set(data);
      this.stats.update(s => ({ ...s, chercheurs: data.length }));
    });
    this.api.getPublications().subscribe(data => {
      this.publications.set(data);
      this.stats.update(s => ({ ...s, publications: data.length }));
    });
    this.api.getEvenements().subscribe(data => {
      this.evenements.set(data);
      this.stats.update(s => ({ ...s, evenements: data.length }));
    });
    this.loadUsers();
    this.loadAxes();
    this.loadDoctorants();
    this.loadMasteriens();
  }

  setTab(tab: string) {
    if (this.userRole() !== 'SUPER_ADMIN' && ['comptes', 'parametres'].includes(tab)) {
      return;
    }
    
    this.activeTab.set(tab);
    this.showForm.set('');
    this.message.set('');
    this.erreur.set('');
    this.csvFile.set(null);
    this.csvImportReport.set(null);
    this.editingAxe.set(null);
    this.editingDoctorant.set(null);
    this.editingMasterien.set(null);
    this.editingPublication.set(null);

    // Charger les paramètres quand on arrive sur l'onglet
    if (tab === 'parametres') {
      this.loadParametres();
    }
  }

  // ── Publications ──────────────────────────────────────────────────────────

  ajouterPublication() {
    this.api.post('publications', this.newPub).subscribe({
      next: (pub: any) => {
        if (this.newPubPdfFile) {
          this.api.uploadPdfPublication(pub.id, this.newPubPdfFile).subscribe({
            next: () => this.api.getPublications().subscribe(data => this.publications.set(data)),
            error: () => this.api.getPublications().subscribe(data => this.publications.set(data))
          });
        } else {
          this.api.getPublications().subscribe(data => this.publications.set(data));
        }
        this.message.set('Publication ajoutée !');
        this.showForm.set('');
        this.newPub = {
          titre: '', type: 'Journal', annee: new Date().getFullYear(), journal: '',
          resume: '', statut: 'PUBLIE', doi: '', pdfUrl: '', lienUrl: '', motsCles: '',
          scimagoQuartile: '', classementCORE: '', facteurImpact: null, snip: null, sourceClassement: ''
        };
        this.clearPdfSelection();
      },
      error: err => this.handleError(err)
    });
  }

  private _pdfBlobUrl: string | null = null;
  get pdfBlobUrl(): string | null { return this._pdfBlobUrl; }

  onPdfFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      if (this._pdfBlobUrl) URL.revokeObjectURL(this._pdfBlobUrl);
      this.newPubPdfFile = input.files[0];
      this._pdfBlobUrl = URL.createObjectURL(this.newPubPdfFile);
      this.newPubPdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this._pdfBlobUrl);
    }
  }

  clearPdfSelection() {
    if (this._pdfBlobUrl) {
      URL.revokeObjectURL(this._pdfBlobUrl);
      this._pdfBlobUrl = null;
    }
    this.newPubPdfPreviewUrl = null;
    this.newPubPdfFile = null;
  }

  // ── Édition de publication ────────────────────────────────────────────────

  startEditPublication(p: any) {
    this.editingPublication.set({
      id: p.id,
      titre: p.titre || '',
      type: p.type || 'Journal',
      annee: p.annee || new Date().getFullYear(),
      journal: p.journal || '',
      resume: p.resume || '',
      doi: p.doi || '',
      lienUrl: p.lienUrl || '',
      motsCles: p.motsCles || '',
      statut: p.statut || 'BROUILLON',
      scimagoQuartile: p.scimagoQuartile ?? null,
      classementCORE: p.classementCORE ?? null,
      facteurImpact: p.facteurImpact ?? null,
      snip: p.snip ?? null,
      sourceClassement: p.sourceClassement || '',
      pdfUrl: p.pdfUrl || null
    });
    this.clearEditPdfSelection();
    this.editRemovePdf = false;
    this._editExistingPdfSafeUrl = null;
    if (this._editExistingPdfBlobUrl) {
      URL.revokeObjectURL(this._editExistingPdfBlobUrl);
      this._editExistingPdfBlobUrl = null;
    }
    this.editPdfViewerUrl.set(null);
    if (p.pdfUrl) {
      this.loadEditExistingPdf();
    }
    this.showForm.set('');
  }

  saveEditPublication() {
    const p = this.editingPublication();
    if (!p) return;
    if (!p.titre?.trim()) { this.message.set('Le titre est obligatoire.'); return; }

    if (this.editRemovePdf && !this.editPubPdfFile) {
      this.api.deletePdfPublication(p.id).subscribe({ next: () => {}, error: () => {} });
      p.pdfUrl = null;
    }

    const payload = {
      ...p,
      scimagoQuartile: p.scimagoQuartile || null,
      classementCORE:  p.classementCORE  || null,
      facteurImpact:   p.facteurImpact   ?? null,
      snip:            p.snip            ?? null,
    };

    this.api.updatePublication(p.id, payload).subscribe({
      next: () => {
        if (this.editPubPdfFile) {
          this.api.uploadPdfPublication(p.id, this.editPubPdfFile).subscribe({
            next: () => {
              this.message.set('Publication mise à jour avec le nouveau PDF !');
              this.clearEditPdfSelection();
              this.editingPublication.set(null);
              this.api.getPublications().subscribe(data => this.publications.set(data));
            },
            error: () => {
              this.message.set('Publication mise à jour, mais erreur lors de l\'upload PDF.');
              this.clearEditPdfSelection();
              this.editingPublication.set(null);
              this.api.getPublications().subscribe(data => this.publications.set(data));
            }
          });
        } else {
          this.message.set('Publication mise à jour !');
          this.editingPublication.set(null);
          this.api.getPublications().subscribe(data => this.publications.set(data));
        }
      },
      error: err => this.handleError(err)
    });
  }

  cancelEditPublication() {
    this.clearEditPdfSelection();
    this.editRemovePdf = false;
    this._editExistingPdfSafeUrl = null;
    if (this._editExistingPdfBlobUrl) {
      URL.revokeObjectURL(this._editExistingPdfBlobUrl);
      this._editExistingPdfBlobUrl = null;
    }
    this.editPdfViewerUrl.set(null);
    this.editingPublication.set(null);
  }

  onEditPdfFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    if (this._editPdfBlobUrl) URL.revokeObjectURL(this._editPdfBlobUrl);
    this.editPubPdfFile = input.files[0];
    this._editPdfBlobUrl = URL.createObjectURL(this.editPubPdfFile);
    this.editPubPdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this._editPdfBlobUrl);
    this.editPdfViewerUrl.set(this.editPubPdfPreviewUrl);
    this.editRemovePdf = false;
  }

  clearEditPdfSelection() {
    if (this._editPdfBlobUrl) {
      URL.revokeObjectURL(this._editPdfBlobUrl);
      this._editPdfBlobUrl = null;
    }
    this.editPubPdfPreviewUrl = null;
    this.editPubPdfFile = null;
    if (!this.editRemovePdf) {
      this.loadEditExistingPdf();
    } else {
      this.editPdfViewerUrl.set(null);
    }
  }

  markRemoveEditPdf() {
    this.editRemovePdf = true;
    this.clearEditPdfSelection();
    this._editExistingPdfSafeUrl = null;
    if (this._editExistingPdfBlobUrl) {
      URL.revokeObjectURL(this._editExistingPdfBlobUrl);
      this._editExistingPdfBlobUrl = null;
    }
    this.editPdfViewerUrl.set(null);
  }

  undoRemoveEditPdf() {
    this.editRemovePdf = false;
    this.loadEditExistingPdf();
  }

  getFullPdfUrl(relativePath: string): string {
    return this.api.getUploadUrl(relativePath);
  }

  getEditExistingPdfUrl(): SafeResourceUrl {
    const p = this.editingPublication();
    if (!p?.pdfUrl) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    if (!this._editExistingPdfSafeUrl) {
      this._editExistingPdfSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl('');
      this.api.getPdfBlob(p.pdfUrl).subscribe({
        next: (blob) => {
          if (this._editExistingPdfBlobUrl) URL.revokeObjectURL(this._editExistingPdfBlobUrl);
          this._editExistingPdfBlobUrl = URL.createObjectURL(blob);
          this._editExistingPdfSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this._editExistingPdfBlobUrl);
        },
        error: () => {
          this._editExistingPdfSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl('');
        }
      });
    }
    return this._editExistingPdfSafeUrl;
  }

  getEditPdfViewerUrl(): SafeResourceUrl | null {
    return this.editPdfViewerUrl();
  }

  private loadEditExistingPdf() {
    const p = this.editingPublication();
    if (!p?.pdfUrl || this.editRemovePdf || this.editPubPdfFile) return;
    this.api.getPdfBlob(p.pdfUrl).subscribe({
      next: (blob) => {
        if (this._editExistingPdfBlobUrl) URL.revokeObjectURL(this._editExistingPdfBlobUrl);
        const pdfBlob = blob.type ? blob : new Blob([blob], { type: 'application/pdf' });
        this._editExistingPdfBlobUrl = URL.createObjectURL(pdfBlob);
        this._editExistingPdfSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this._editExistingPdfBlobUrl);
        this.editPdfViewerUrl.set(this._editExistingPdfSafeUrl);
      },
      error: () => {
        this._editExistingPdfSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl('');
        this.editPdfViewerUrl.set(null);
      }
    });
  }

  validerPublication(id: number) {
    this.api.patch(`publications/${id}/statut`, { statut: 'PUBLIE' }).subscribe({
      next: () => {
        this.message.set('Publication validée !');
        this.api.getPublications().subscribe(data => this.publications.set(data));
      },
      error: err => this.handleError(err)
    });
  }

  rejeterPublication(id: number) {
    this.api.patch(`publications/${id}/statut`, { statut: 'BROUILLON' }).subscribe({
      next: () => {
        this.message.set('Publication renvoyée en brouillon.');
        this.api.getPublications().subscribe(data => this.publications.set(data));
      },
      error: err => this.handleError(err)
    });
  }

  supprimerPublication(id: number) {
    if (!confirm('Supprimer cette publication ?')) return;
    this.api.delete('publications/' + id).subscribe({
      next: () => {
        this.message.set('Publication supprimée.');
        this.api.getPublications().subscribe(data => this.publications.set(data));
      },
      error: err => this.handleError(err)
    });
  }

  getStatutClass(statut: string): string {
    if (statut === 'PUBLIE')    return 'statut-publie';
    if (statut === 'SOUMIS')    return 'statut-soumis';
    if (statut === 'BROUILLON') return 'statut-brouillon';
    return '';
  }

  getStatutLabel(statut: string): string {
    if (statut === 'PUBLIE')    return '✅ Publié';
    if (statut === 'SOUMIS')    return '⏳ Soumis';
    if (statut === 'BROUILLON') return '📝 Brouillon';
    return statut || '-';
  }

  // ── Événements ────────────────────────────────────────────────────────────

  ajouterEvenement() {
    this.api.post('evenements', this.newEvent).subscribe({
      next: () => {
        this.message.set('Événement ajouté !');
        this.showForm.set('');
        this.newEvent = { titre: '', type: 'Séminaire', dateEvenement: '', lieu: '', description: '' };
        this.api.getEvenements().subscribe(data => this.evenements.set(data));
      },
      error: err => this.handleError(err)
    });
  }

  supprimerEvenement(id: number) {
    if (!confirm('Supprimer cet événement ?')) return;
    this.api.delete('evenements/' + id).subscribe({
      next: () => {
        this.message.set('Événement supprimé.');
        this.api.getEvenements().subscribe(data => this.evenements.set(data));
      },
      error: err => this.handleError(err)
    });
  }

  // ── Chercheurs ────────────────────────────────────────────────────────────

  exportChercheursCsv() {
    this.message.set('Téléchargement du CSV en cours...');
    this.erreur.set('');
    this.api.exportChercheursCsv();
  }

  onCsvFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.csvFile.set(file);
    this.csvImportReport.set(null);
    this.message.set('');
    this.erreur.set('');
    if (input) input.value = '';
  }

  importChercheursCsv() {
    const file = this.csvFile();
    if (!file) {
      this.erreur.set('Veuillez sélectionner un fichier CSV.');
      return;
    }
    this.api.importChercheursCsv(file).subscribe({
      next: (res: any) => {
        this.csvImportReport.set({
          importes: res.importes ?? 0,
          ignores: res.ignores ?? 0,
          erreurs: res.erreurs ?? []
        });
        this.message.set(res.message || 'Import CSV terminé.');
        this.erreur.set('');
        this.csvFile.set(null);
        this.api.getChercheurs().subscribe(data => {
          this.chercheurs.set(data);
          this.stats.update(s => ({ ...s, chercheurs: data.length }));
        });
      },
      error: err => this.handleError(err)
    });
  }

  supprimerChercheur(id: number) {
    if (!confirm('Supprimer ce chercheur ?')) return;
    this.api.delete('chercheurs/' + id).subscribe({
      next: () => {
        this.message.set('Chercheur supprimé.');
        this.api.getChercheurs().subscribe(data => this.chercheurs.set(data));
      },
      error: err => this.handleError(err)
    });
  }

  // ── Comptes ───────────────────────────────────────────────────────────────

  loadUsers() {
    this.api.getUsers().subscribe(data => {
      this.users.set(data);
      this.stats.update(s => ({ ...s, users: data.length }));
    });
  }

  creerCompte() {
    if (!this.newUser.email || !this.newUser.motDePasse) {
      this.message.set('Email et mot de passe obligatoires.');
      return;
    }
    this.api.post('users', this.newUser).subscribe({
      next: (res: any) => {
        if (res.error) {
          this.message.set(res.error);
        } else {
          this.message.set('Compte créé avec succès !');
          this.showForm.set('');
          this.newUser = { email: '', motDePasse: '', role: 'CHERCHEUR' };
          this.loadUsers();
        }
      }
    });
  }

  changerRole(id: number, event: Event) {
    const userToModify = this.users().find(u => u.id === id);
    if (userToModify && userToModify.email === this.email()) {
      this.erreur.set("Vous ne pouvez pas modifier votre propre rôle.");
      return;
    }
    const role = (event.target as HTMLSelectElement).value;
    this.api.patch(`users/${id}/role`, { role }).subscribe({
      next: () => {
        this.message.set('Rôle modifié.');
        this.loadUsers();
      },
      error: err => this.handleError(err)
    });
  }

  toggleActif(id: number) {
    const userToModify = this.users().find(u => u.id === id);
    if (userToModify && userToModify.email === this.email()) {
      this.erreur.set("Vous ne pouvez pas désactiver votre propre compte.");
      return;
    }
    this.api.patch(`users/${id}/toggle`, {}).subscribe({
      next: () => {
        this.message.set('Statut modifié.');
        this.loadUsers();
      },
      error: err => this.handleError(err)
    });
  }

  supprimerUser(id: number) {
    const userToModify = this.users().find(u => u.id === id);
    if (userToModify && userToModify.email === this.email()) {
      this.erreur.set("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }
    if (!confirm('Supprimer ce compte définitivement ?')) return;
    this.api.delete('users/' + id).subscribe({
      next: () => {
        this.message.set('Compte supprimé.');
        this.loadUsers();
      },
      error: err => this.handleError(err)
    });
  }

  // ── Axes ──────────────────────────────────────────────────────────────────

  loadAxes() {
    this.api.getAxes().subscribe(data => {
      this.axes.set(data);
      this.stats.update(s => ({ ...s, axes: data.length }));
    });
  }

  ajouterAxe() {
    if (!this.newAxe.nom.trim()) { this.message.set("Le nom de l'axe est obligatoire."); return; }
    this.api.createAxe(this.newAxe).subscribe({
      next: () => {
        this.message.set('Axe créé !');
        this.showForm.set('');
        this.newAxe = { nom: '', description: '', responsableId: null };
        this.loadAxes();
      },
      error: err => this.handleError(err)
    });
  }

  startEditAxe(axe: any) {
    this.editingAxe.set({ id: axe.id, nom: axe.nom, description: axe.description || '', responsableId: axe.responsable?.id ?? null });
  }

  saveEditAxe() {
    const axe = this.editingAxe();
    if (!axe) return;
    this.api.updateAxe(axe.id, axe).subscribe({
      next: () => {
        this.message.set('Axe mis à jour !');
        this.editingAxe.set(null);
        this.loadAxes();
      },
      error: err => this.handleError(err)
    });
  }

  cancelEditAxe() { this.editingAxe.set(null); }

  supprimerAxe(id: number) {
    if (!confirm("Supprimer cet axe ?")) return;
    this.api.deleteAxe(id).subscribe({
      next: () => {
        this.message.set('Axe supprimé.');
        this.loadAxes();
      },
      error: err => this.handleError(err)
    });
  }

  getAssocChercheur(axeId: number): number | null { return this.assocMap()[axeId] ?? null; }

  setAssocChercheur(axeId: number, event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.assocMap.update(m => ({ ...m, [axeId]: val ? +val : null }));
  }

  associerChercheur(axeId: number) {
    const cid = this.getAssocChercheur(axeId);
    if (!cid) return;
    this.api.addChercheurToAxe(axeId, cid).subscribe({
      next: () => {
        this.message.set("Chercheur associé à l'axe !");
        this.assocMap.update(m => ({ ...m, [axeId]: null }));
        this.loadAxes();
      },
      error: err => this.handleError(err)
    });
  }

  retirerChercheur(axeId: number, chercheurId: number) {
    if (!confirm("Retirer ce chercheur de l'axe ?")) return;
    this.api.removeChercheurFromAxe(axeId, chercheurId).subscribe({
      next: () => {
        this.message.set('Chercheur retiré.');
        this.loadAxes();
      },
      error: err => this.handleError(err)
    });
  }

  // ── Doctorants ────────────────────────────────────────────────────────────

  loadDoctorants() {
    this.api.getDoctorants().subscribe(data => {
      this.doctorants.set(data);
      this.stats.update(s => ({ ...s, doctorants: data.length }));
    });
  }

  ajouterDoctorant() {
    if (!this.newDoctorant.nom || !this.newDoctorant.prenom) {
      this.message.set('Nom et prénom obligatoires.');
      return;
    }
    this.api.createDoctorant(this.newDoctorant).subscribe({
      next: () => {
        this.message.set('Doctorant ajouté !');
        this.showForm.set('');
        this.newDoctorant = { nom: '', prenom: '', sujetThese: '', directeurId: null, dateInscription: '', statut: 'EN_COURS', mention: '', photoUrl: '' };
        this.loadDoctorants();
      },
      error: err => this.handleError(err)
    });
  }

  startEditDoctorant(d: any) {
    this.editingDoctorant.set({
      id: d.id, nom: d.nom, prenom: d.prenom,
      sujetThese: d.sujetThese || '',
      directeurId: d.directeur?.id ?? null,
      dateInscription: d.dateInscription || '',
      dateSoutenance: d.dateSoutenance || '',
      statut: d.statut || 'EN_COURS',
      mention: d.mention || '',
      photoUrl: d.photoUrl || ''
    });
  }

  saveEditDoctorant() {
    const d = this.editingDoctorant();
    if (!d) return;
    this.api.updateDoctorant(d.id, d).subscribe({
      next: () => {
        this.message.set('Doctorant mis à jour !');
        this.editingDoctorant.set(null);
        this.loadDoctorants();
      },
      error: err => this.handleError(err)
    });
  }

  cancelEditDoctorant() { this.editingDoctorant.set(null); }

  supprimerDoctorant(id: number) {
    if (!confirm('Supprimer ce doctorant ?')) return;
    this.api.deleteDoctorant(id).subscribe({
      next: () => {
        this.message.set('Doctorant supprimé.');
        this.loadDoctorants();
      },
      error: err => this.handleError(err)
    });
  }

  // ── Mastériens ────────────────────────────────────────────────────────────

  loadMasteriens() {
    this.api.getMasteriens().subscribe(data => {
      this.masteriens.set(data);
      this.stats.update(s => ({ ...s, masteriens: data.length }));
    });
  }

  ajouterMasterien() {
    if (!this.newMasterien.nom || !this.newMasterien.prenom) {
      this.message.set('Nom et prénom obligatoires.');
      return;
    }
    this.api.createMasterien(this.newMasterien).subscribe({
      next: () => {
        this.message.set('Mastérien ajouté !');
        this.showForm.set('');
        this.newMasterien = { nom: '', prenom: '', sujetMemoire: '', encadrantId: null, promotion: '', statut: 'EN_COURS' };
        this.loadMasteriens();
      },
      error: err => this.handleError(err)
    });
  }

  startEditMasterien(m: any) {
    this.editingMasterien.set({
      id: m.id, nom: m.nom, prenom: m.prenom,
      sujetMemoire: m.sujetMemoire || '',
      encadrantId: m.encadrant?.id ?? null,
      promotion: m.promotion || '',
      statut: m.statut || 'EN_COURS'
    });
  }

  saveEditMasterien() {
    const m = this.editingMasterien();
    if (!m) return;
    this.api.updateMasterien(m.id, m).subscribe({
      next: () => {
        this.message.set('Mastérien mis à jour !');
        this.editingMasterien.set(null);
        this.loadMasteriens();
      },
      error: err => this.handleError(err)
    });
  }

  cancelEditMasterien() { this.editingMasterien.set(null); }

  supprimerMasterien(id: number) {
    if (!confirm('Supprimer ce mastérien ?')) return;
    this.api.deleteMasterien(id).subscribe({
      next: () => {
        this.message.set('Mastérien supprimé.');
        this.loadMasteriens();
      },
      error: err => this.handleError(err)
    });
  }

  fermerTout() {
    this.showForm.set('');
    this.message.set('');
    this.erreur.set('');
    this.editingAxe.set(null);
    this.editingDoctorant.set(null);
    this.editingMasterien.set(null);
    this.editingPublication.set(null);
  }

  // ── §4.3.6 — Paramètres généraux ─────────────────────────────────────────

  /**
   * Charge tous les paramètres depuis le backend et remplit les formulaires.
   * Appelé automatiquement à l'arrivée sur l'onglet "Paramètres".
   */
  loadParametres() {
    this.parametresLoading.set(true);
    this.api.getParametres().subscribe({
      next: (params: any[]) => {
        // Construire un dictionnaire cle → valeur pour un accès facile
        const map: Record<string, string> = {};
        params.forEach(p => { map[p.cle] = p.valeur ?? ''; });

        // Peupler le formulaire labo
        this.laboForm = {
          nom:         map['labo.nom']         ?? '',
          acronyme:    map['labo.acronyme']     ?? '',
          description: map['labo.description']  ?? '',
          email:       map['labo.email']        ?? '',
          telephone:   map['labo.telephone']    ?? '',
          adresse:     map['labo.adresse']      ?? '',
        };

        // Peupler le formulaire thème (garder les valeurs par défaut si absent)
        this.themeForm = {
          dark: {
            bgPrimary: map['theme.dark.bgPrimary'] ?? this.THEME_DEFAULTS.dark.bgPrimary,
            bgSecondary: map['theme.dark.bgSecondary'] ?? this.THEME_DEFAULTS.dark.bgSecondary,
            bgCard: map['theme.dark.bgCard'] ?? this.THEME_DEFAULTS.dark.bgCard,
            bgInput: map['theme.dark.bgInput'] ?? this.THEME_DEFAULTS.dark.bgInput,
            bgSidebar: map['theme.dark.bgSidebar'] ?? this.THEME_DEFAULTS.dark.bgSidebar,
            bgModal: map['theme.dark.bgModal'] ?? this.THEME_DEFAULTS.dark.bgModal,
            bgTableHead: map['theme.dark.bgTableHead'] ?? this.THEME_DEFAULTS.dark.bgTableHead,
            bgTableRow: map['theme.dark.bgTableRow'] ?? this.THEME_DEFAULTS.dark.bgTableRow,
            bgTableHover: map['theme.dark.bgTableHover'] ?? this.THEME_DEFAULTS.dark.bgTableHover,
            bgNavbar: map['theme.dark.bgNavbar'] ?? this.THEME_DEFAULTS.dark.bgNavbar,
            textPrimary: map['theme.dark.textPrimary'] ?? this.THEME_DEFAULTS.dark.textPrimary,
            textSecondary: map['theme.dark.textSecondary'] ?? this.THEME_DEFAULTS.dark.textSecondary,
            textMuted: map['theme.dark.textMuted'] ?? this.THEME_DEFAULTS.dark.textMuted,
            textHeading: map['theme.dark.textHeading'] ?? this.THEME_DEFAULTS.dark.textHeading,
            textBody: map['theme.dark.textBody'] ?? this.THEME_DEFAULTS.dark.textBody,
            textPlaceholder: map['theme.dark.textPlaceholder'] ?? this.THEME_DEFAULTS.dark.textPlaceholder,
            borderColor: map['theme.dark.borderColor'] ?? this.THEME_DEFAULTS.dark.borderColor,
            borderSubtle: map['theme.dark.borderSubtle'] ?? this.THEME_DEFAULTS.dark.borderSubtle,
            accent: map['theme.dark.accent'] ?? this.THEME_DEFAULTS.dark.accent,
            accentHover: map['theme.dark.accentHover'] ?? this.THEME_DEFAULTS.dark.accentHover,
            success: map['theme.dark.success'] ?? this.THEME_DEFAULTS.dark.success,
            warning: map['theme.dark.warning'] ?? this.THEME_DEFAULTS.dark.warning,
            danger: map['theme.dark.danger'] ?? this.THEME_DEFAULTS.dark.danger,
          },
          light: {
            bgPrimary: map['theme.light.bgPrimary'] ?? this.THEME_DEFAULTS.light.bgPrimary,
            bgSecondary: map['theme.light.bgSecondary'] ?? this.THEME_DEFAULTS.light.bgSecondary,
            bgCard: map['theme.light.bgCard'] ?? this.THEME_DEFAULTS.light.bgCard,
            bgInput: map['theme.light.bgInput'] ?? this.THEME_DEFAULTS.light.bgInput,
            bgSidebar: map['theme.light.bgSidebar'] ?? this.THEME_DEFAULTS.light.bgSidebar,
            bgModal: map['theme.light.bgModal'] ?? this.THEME_DEFAULTS.light.bgModal,
            bgTableHead: map['theme.light.bgTableHead'] ?? this.THEME_DEFAULTS.light.bgTableHead,
            bgTableRow: map['theme.light.bgTableRow'] ?? this.THEME_DEFAULTS.light.bgTableRow,
            bgTableHover: map['theme.light.bgTableHover'] ?? this.THEME_DEFAULTS.light.bgTableHover,
            bgNavbar: map['theme.light.bgNavbar'] ?? this.THEME_DEFAULTS.light.bgNavbar,
            textPrimary: map['theme.light.textPrimary'] ?? this.THEME_DEFAULTS.light.textPrimary,
            textSecondary: map['theme.light.textSecondary'] ?? this.THEME_DEFAULTS.light.textSecondary,
            textMuted: map['theme.light.textMuted'] ?? this.THEME_DEFAULTS.light.textMuted,
            textHeading: map['theme.light.textHeading'] ?? this.THEME_DEFAULTS.light.textHeading,
            textBody: map['theme.light.textBody'] ?? this.THEME_DEFAULTS.light.textBody,
            textPlaceholder: map['theme.light.textPlaceholder'] ?? this.THEME_DEFAULTS.light.textPlaceholder,
            borderColor: map['theme.light.borderColor'] ?? this.THEME_DEFAULTS.light.borderColor,
            borderSubtle: map['theme.light.borderSubtle'] ?? this.THEME_DEFAULTS.light.borderSubtle,
            accent: map['theme.light.accent'] ?? this.THEME_DEFAULTS.light.accent,
            accentHover: map['theme.light.accentHover'] ?? this.THEME_DEFAULTS.light.accentHover,
            success: map['theme.light.success'] ?? this.THEME_DEFAULTS.light.success,
            warning: map['theme.light.warning'] ?? this.THEME_DEFAULTS.light.warning,
            danger: map['theme.light.danger'] ?? this.THEME_DEFAULTS.light.danger,
          }
        };

        // Parametres SMTP (mot de passe vide tant qu'il n'est pas change)
        this.smtpForm = {
          host: map['smtp.host'] ?? '',
          port: map['smtp.port'] ?? '',
          username: map['smtp.username'] ?? '',
          destinataire: map['smtp.destinataire'] ?? '',
          password: ''
        };

        // Logos existants
        const logoLightUrl = map['labo.logoUrlLight'] ?? '';
        const logoDarkUrl = map['labo.logoUrlDark'] ?? '';
        this.logoUrlCouranteLight.set(logoLightUrl);
        this.logoUrlCouranteDark.set(logoDarkUrl);
        // Ne pas écraser la preview locale si l'admin a déjà sélectionné un fichier
        if (!this.logoLightFile) {
          this.logoPreviewUrlLight.set(logoLightUrl ? this.api.getLogoUrl(logoLightUrl) : '');
        }
        if (!this.logoDarkFile) {
          this.logoPreviewUrlDark.set(logoDarkUrl ? this.api.getLogoUrl(logoDarkUrl) : '');
        }
        this.logoLightDeleted.set(false);
        this.logoDarkDeleted.set(false);

        // SEO — charger chaque page
        for (const page of this.SEO_PAGES) {
          this.seoForm[page.key] = {
            titre:       map[`seo.${page.key}.titre`]       ?? '',
            description: map[`seo.${page.key}.description`] ?? '',
            motsCles:    map[`seo.${page.key}.motsCles`]    ?? '',
          };
        }

        this.appliquerCouleursTheme(this.themeService.theme(), this.themeForm[this.themeService.theme()]);

        this.parametresLoading.set(false);
      },
      error: err => {
        this.parametresLoading.set(false);
        this.handleError(err);
      }
    });
  }

  /**
   * Appelé à chaque changement d'un color picker pour prévisualiser
   * les nouvelles couleurs en temps réel sans sauvegarder.
   */
  onCouleurChange(themeKey: ThemeKey) {
    this.appliquerCouleursTheme(themeKey, this.themeForm[themeKey]);
  }

  /**
   * Liaison (input) du color picker natif → met à jour themeForm et
   * prévisualise immédiatement la couleur choisie.
  * Appelé par : (input)="onColorInput('dark', 'accent', $event)"
   */
  onColorInput(themeKey: ThemeKey, key: keyof ThemePalette, event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.themeForm = {
      ...this.themeForm,
      [themeKey]: { ...this.themeForm[themeKey], [key]: val }
    };
    this.appliquerCouleursTheme(themeKey, this.themeForm[themeKey]);
  }

  /**
   * Liaison (change) du champ texte hexadécimal → valide le format
   * et synchronise le color picker avec la valeur saisie.
  * Appelé par : (change)="onColorText('dark', 'accent', $event)"
   */
  onColorText(themeKey: ThemeKey, key: keyof ThemePalette, event: Event) {
    const raw = (event.target as HTMLInputElement).value.trim();
    // Accepter #rrggbb, #rgb, rgb(a) et linear-gradient()
    const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
    const rgbRegex = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/;
    const gradientRegex = /^linear-gradient\(/i;
    if (!hexRegex.test(raw) && !rgbRegex.test(raw) && !gradientRegex.test(raw)) return;
    this.themeForm = {
      ...this.themeForm,
      [themeKey]: { ...this.themeForm[themeKey], [key]: raw }
    };
    this.appliquerCouleursTheme(themeKey, this.themeForm[themeKey]);
  }

  /**
   * Alias public pour le bouton "Réinitialiser les couleurs par défaut"
   * dans le template HTML (dashboard-admin.html ligne ~1294).
   * Délègue à reinitialiserCouleurs() qui contient la logique réelle.
   */
  resetCouleursDefaut(themeKey: ThemeKey) {
    this.reinitialiserCouleurs(themeKey);
  }

  /** Ouvre/ferme un panneau de la liste SEO (accordéon) */
  toggleSeoPage(key: string) {
    this.seoPageActive.set(this.seoPageActive() === key ? '' : key);
  }

  /** Ouvre/ferme une section de paramètres dans l'accordéon */
  toggleParamsSection(key: string) {
    this.activeParamsSection.set(this.activeParamsSection() === key ? '' : key);
  }

  /**
   * Applique les couleurs du formulaire comme variables CSS sur :root
   * afin que tout le dashboard reflète les changements en direct.
   */
  private appliquerCouleursTheme(themeKey: ThemeKey, theme: ThemePalette) {
    if (themeKey !== this.themeService.theme()) return;
    const root = document.documentElement;
    const body = document.body;

    const setVar = (name: string, value: string) => {
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
      setVar(this.THEME_VAR_MAP[key], theme[key]);
    });

    const accentSoft = toRgba(theme.accent, 0.1);
    const dangerSoft = toRgba(theme.danger, 0.12);
    const successSoft = toRgba(theme.success, 0.1);
    const warningSoft = toRgba(theme.warning, 0.1);

    if (accentSoft) setVar('--accent-soft', accentSoft);
    if (dangerSoft) setVar('--danger-soft', dangerSoft);
    if (successSoft) setVar('--success-soft', successSoft);
    if (warningSoft) setVar('--warning-soft', warningSoft);
  }

  /**
   * Réinitialise les couleurs aux valeurs par défaut du thème sélectionné.
   */
  reinitialiserCouleurs(themeKey: ThemeKey) {
    this.themeForm = {
      ...this.themeForm,
      [themeKey]: { ...this.THEME_DEFAULTS[themeKey] }
    };
    this.appliquerCouleursTheme(themeKey, this.themeForm[themeKey]);
  }

  /**
   * Gère la sélection d'un fichier logo depuis l'input file.
   * Génère immédiatement une prévisualisation locale (blob URL).
   */
  onLogoFileSelected(themeKey: ThemeKey, event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];

    // Valider côté client (type + taille) avant même d'envoyer
    if (!file.type.startsWith('image/')) {
      this.erreur.set('Seules les images sont acceptées (PNG, JPEG, SVG, WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.erreur.set('Le logo ne doit pas dépasser 2 Mo.');
      return;
    }

    if (themeKey === 'light') {
      this.logoLightFile = file;
      this.logoLightDeleted.set(false);
    } else {
      this.logoDarkFile = file;
      this.logoDarkDeleted.set(false);
    }
    this.erreur.set('');

    // Prévisualisation locale immédiate
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (themeKey === 'light') {
        this.logoPreviewUrlLight.set(url);
      } else {
        this.logoPreviewUrlDark.set(url);
      }
    };
    reader.readAsDataURL(file);
  }

  /**
   * Annule la sélection en cours et revient au logo sauvegardé.
   */
  annulerLogoSelection(themeKey: ThemeKey) {
    if (themeKey === 'light') {
      this.logoLightFile = null;
      this.logoLightDeleted.set(false);
      const urlCourante = this.logoUrlCouranteLight();
      this.logoPreviewUrlLight.set(urlCourante ? this.api.getLogoUrl(urlCourante) : '');
    } else {
      this.logoDarkFile = null;
      this.logoDarkDeleted.set(false);
      const urlCourante = this.logoUrlCouranteDark();
      this.logoPreviewUrlDark.set(urlCourante ? this.api.getLogoUrl(urlCourante) : '');
    }
  }

  supprimerLogo(themeKey: ThemeKey) {
    if (!confirm('Supprimer ce logo ?')) return;
    if (themeKey === 'light') {
      this.logoLightFile = null;
      this.logoUrlCouranteLight.set('');
      this.logoPreviewUrlLight.set('');
      this.logoLightDeleted.set(true);
    } else {
      this.logoDarkFile = null;
      this.logoUrlCouranteDark.set('');
      this.logoPreviewUrlDark.set('');
      this.logoDarkDeleted.set(true);
    }
  }

  /**
   * Sauvegarde les paramètres labo + thème en une seule opération.
   * Si un nouveau logo a été sélectionné, il est uploadé en premier.
   */
  sauvegarderParametres() {
    this.parametresSaving.set(true);
    this.message.set('');
    this.erreur.set('');

    const uploads: { key: ThemeKey; file: File }[] = [];
    if (this.logoLightFile) uploads.push({ key: 'light', file: this.logoLightFile });
    if (this.logoDarkFile) uploads.push({ key: 'dark', file: this.logoDarkFile });

    const uploadNext = (index: number) => {
      if (index >= uploads.length) {
        this.sauvegarderParamsTexte();
        return;
      }
      const current = uploads[index];
      this.api.uploadLogo(current.file).subscribe({
        next: (res) => {
          if (current.key === 'light') {
            this.logoUrlCouranteLight.set(res.logoUrl);
            this.logoLightFile = null;
          } else {
            this.logoUrlCouranteDark.set(res.logoUrl);
            this.logoDarkFile = null;
          }
          uploadNext(index + 1);
        },
        error: err => {
          this.parametresSaving.set(false);
          this.handleError(err);
        }
      });
    };

    uploadNext(0);
  }

  /**
   * Envoi en lot de tous les paramètres texte (labo + thème) vers le backend.
   */
  private sauvegarderParamsTexte() {
    const payload: Record<string, string> = {
      // Identité labo
      'labo.nom':         this.laboForm.nom,
      'labo.acronyme':    this.laboForm.acronyme,
      'labo.description': this.laboForm.description,
      'labo.email':       this.laboForm.email,
      'labo.telephone':   this.laboForm.telephone,
      'labo.adresse':     this.laboForm.adresse,
      // SMTP
      'smtp.host': this.smtpForm.host,
      'smtp.port': String(this.smtpForm.port || ''),
      'smtp.username': this.smtpForm.username,
      'smtp.destinataire': this.smtpForm.destinataire,
      // Couleurs du thème (dark)
      'theme.dark.bgPrimary': this.themeForm.dark.bgPrimary,
      'theme.dark.bgSecondary': this.themeForm.dark.bgSecondary,
      'theme.dark.bgCard': this.themeForm.dark.bgCard,
      'theme.dark.bgInput': this.themeForm.dark.bgInput,
      'theme.dark.bgSidebar': this.themeForm.dark.bgSidebar,
      'theme.dark.bgModal': this.themeForm.dark.bgModal,
      'theme.dark.bgTableHead': this.themeForm.dark.bgTableHead,
      'theme.dark.bgTableRow': this.themeForm.dark.bgTableRow,
      'theme.dark.bgTableHover': this.themeForm.dark.bgTableHover,
      'theme.dark.bgNavbar': this.themeForm.dark.bgNavbar,
      'theme.dark.textPrimary': this.themeForm.dark.textPrimary,
      'theme.dark.textSecondary': this.themeForm.dark.textSecondary,
      'theme.dark.textMuted': this.themeForm.dark.textMuted,
      'theme.dark.textHeading': this.themeForm.dark.textHeading,
      'theme.dark.textBody': this.themeForm.dark.textBody,
      'theme.dark.textPlaceholder': this.themeForm.dark.textPlaceholder,
      'theme.dark.borderColor': this.themeForm.dark.borderColor,
      'theme.dark.borderSubtle': this.themeForm.dark.borderSubtle,
      'theme.dark.accent': this.themeForm.dark.accent,
      'theme.dark.accentHover': this.themeForm.dark.accentHover,
      'theme.dark.success': this.themeForm.dark.success,
      'theme.dark.warning': this.themeForm.dark.warning,
      'theme.dark.danger': this.themeForm.dark.danger,
      // Couleurs du thème (light)
      'theme.light.bgPrimary': this.themeForm.light.bgPrimary,
      'theme.light.bgSecondary': this.themeForm.light.bgSecondary,
      'theme.light.bgCard': this.themeForm.light.bgCard,
      'theme.light.bgInput': this.themeForm.light.bgInput,
      'theme.light.bgSidebar': this.themeForm.light.bgSidebar,
      'theme.light.bgModal': this.themeForm.light.bgModal,
      'theme.light.bgTableHead': this.themeForm.light.bgTableHead,
      'theme.light.bgTableRow': this.themeForm.light.bgTableRow,
      'theme.light.bgTableHover': this.themeForm.light.bgTableHover,
      'theme.light.bgNavbar': this.themeForm.light.bgNavbar,
      'theme.light.textPrimary': this.themeForm.light.textPrimary,
      'theme.light.textSecondary': this.themeForm.light.textSecondary,
      'theme.light.textMuted': this.themeForm.light.textMuted,
      'theme.light.textHeading': this.themeForm.light.textHeading,
      'theme.light.textBody': this.themeForm.light.textBody,
      'theme.light.textPlaceholder': this.themeForm.light.textPlaceholder,
      'theme.light.borderColor': this.themeForm.light.borderColor,
      'theme.light.borderSubtle': this.themeForm.light.borderSubtle,
      'theme.light.accent': this.themeForm.light.accent,
      'theme.light.accentHover': this.themeForm.light.accentHover,
      'theme.light.success': this.themeForm.light.success,
      'theme.light.warning': this.themeForm.light.warning,
      'theme.light.danger': this.themeForm.light.danger,
    };

    if (this.logoLightDeleted()) {
      payload['labo.logoUrlLight'] = '';
    } else if (this.logoUrlCouranteLight()) {
      payload['labo.logoUrlLight'] = this.logoUrlCouranteLight();
    }
    if (this.logoDarkDeleted()) {
      payload['labo.logoUrlDark'] = '';
    } else if (this.logoUrlCouranteDark()) {
      payload['labo.logoUrlDark'] = this.logoUrlCouranteDark();
    }

    // SEO par page
    for (const page of this.SEO_PAGES) {
      const f = this.seoForm[page.key];
      payload[`seo.${page.key}.titre`]       = f.titre;
      payload[`seo.${page.key}.description`] = f.description;
      payload[`seo.${page.key}.motsCles`]    = f.motsCles;
    }

    if (this.smtpForm.password.trim()) {
      payload['smtp.password'] = this.smtpForm.password.trim();
    }

    this.api.updateParametresLot(payload).subscribe({
      next: () => {
        this.parametresSaving.set(false);
        this.message.set('Paramètres sauvegardés avec succès !');
        this.settings.refresh();
        this.smtpForm = { ...this.smtpForm, password: '' };
      },
      error: err => {
        this.parametresSaving.set(false);
        this.handleError(err);
      }
    });
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  logout() {
    this.api.logout().subscribe({
      next: () => {
        localStorage.clear();
        this.router.navigate(['/login']);
      },
      error: () => {
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    });
  }
}