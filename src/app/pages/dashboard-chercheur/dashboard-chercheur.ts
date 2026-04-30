import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';
import { ThemeService } from '../../services/theme.service';
import { Publication } from '../../models/chercheur.model';

@Component({
  selector: 'app-dashboard-chercheur',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './dashboard-chercheur.html',
  styleUrls: ['./dashboard-chercheur.css']
})
export class DashboardChercheur implements OnInit {
  email        = signal('');
  role         = signal('');
  activeTab    = signal('publications');
  encTab       = signal('doctorants'); // Onglet actif pour ajouter des encadrements
  publications = signal<Publication[]>([]);
  message      = signal('');
  chercheurId  = signal<number | null>(null);
  profil       = signal<any>({});

  // ── Encadrements ────────────────────────────────────────
  mesDoctorants    = signal<any[]>([]);
  mesMasteriens    = signal<any[]>([]);
  doctorantsDispos = signal<any[]>([]);
  masteriensDispos = signal<any[]>([]);
  encMsg           = signal('');

  editProfil = {
    grade: '', specialite: '', institution: '',
    bureau: '', telephone: '', biographie: '',
    googleScholar: '', researchGate: '', orcid: '', linkedin: ''
  };

  newPub: {
    titre: string; type: string; annee: number;
    journal: string; resume: string; doi: string; lienUrl: string; statut: string;
    // §3.7.2 CDC — Score / classement de la venue
    scimagoQuartile: string; classementCORE: string;
    facteurImpact: number | null; snip: number | null;
    sourceClassement: string;
  } = {
    titre: '', type: 'Journal',
    annee: new Date().getFullYear(),
    journal: '', resume: '',
    doi: '', lienUrl: '',
    statut: 'BROUILLON',
    // §3.7.2 — champs classement
    scimagoQuartile: '', classementCORE: '',
    facteurImpact: null, snip: null, sourceClassement: ''
  };
  newPubPdfFile: File | null = null;
  newPubPdfPreviewUrl: SafeResourceUrl | null = null;
  private _pdfBlobUrl: string | null = null;
  get pdfBlobUrl(): string | null { return this._pdfBlobUrl; }

  // ── Édition de publication ────────────────────────────────
  editingPublication = signal<any | null>(null);

  // §3.7.2 — PDF dans le formulaire d'édition
  editPubPdfFile: File | null = null;
  editPubPdfPreviewUrl: SafeResourceUrl | null = null;
  private _editPdfBlobUrl: string | null = null;
  get editPdfBlobUrl(): string | null { return this._editPdfBlobUrl; }
  editPdfViewerUrl = signal<SafeResourceUrl | null>(null);
  editRemovePdf = false;
  private _editExistingPdfSafeUrl: SafeResourceUrl | null = null;
  private _editExistingPdfBlobUrl: string | null = null;

  pubBrouillons = computed(() => this.publications().filter(p => p.statut === 'BROUILLON' || !p.statut).length);
  pubSoumises   = computed(() => this.publications().filter(p => p.statut === 'SOUMIS').length);
  pubPubliees   = computed(() => this.publications().filter(p => p.statut === 'PUBLIE').length);

  constructor(private router: Router, private api: ApiService, private sanitizer: DomSanitizer, public themeService: ThemeService) {}

  private handleError(error: any) {
    const message = error?.error?.message || error?.message || error?.statusText || 'Erreur backend';
    this.message.set('Erreur : ' + message);
  }

  ngOnInit() {
    this.email.set(localStorage.getItem('email') || '');
    this.role.set(localStorage.getItem('role') || '');
    this.loadProfil();
  }

  viewPublication(id: number) {
    this.router.navigate(['/publications', id]);
  }

  loadProfil() {
    const email = this.email();
    this.api.getChercheurs().subscribe((data: any[]) => {
      const c = data.find(ch => ch.user?.email === email || ch.email === email);
      if (c) {
        this.chercheurId.set(c.id);
        this.profil.set(c);
        this.editProfil = {
          grade:         c.grade         || '',
          specialite:    c.specialite    || '',
          institution:   c.institution   || '',
          bureau:        c.bureau        || '',
          telephone:     c.telephone     || '',
          biographie:    c.biographie    || '',
          googleScholar: c.googleScholar || '',
          researchGate:  c.researchGate  || '',
          orcid:         c.orcid         || '',
          linkedin:      c.linkedin      || ''
        };
        this.publications.set(c.publications || []);
        this.chargerEncadrements(c.id);
      }
    });
  }

  chargerEncadrements(cid: number) {
    this.api.getDoctorants().subscribe((data: any[]) => {
      this.mesDoctorants.set(data.filter(d => d.directeur?.id === cid));
      this.doctorantsDispos.set(data.filter(d => !d.directeur));
    });
    this.api.getMasteriens().subscribe((data: any[]) => {
      this.mesMasteriens.set(data.filter(m => m.encadrant?.id === cid));
      this.masteriensDispos.set(data.filter(m => !m.encadrant));
    });
  }

  assignerDoctorant(doctorantId: number) {
    const cid = this.chercheurId();
    if (!cid) return;
    this.api.updateDoctorant(doctorantId, { directeurId: cid }).subscribe({
      next: () => {
        this.encMsg.set('Doctorant assigné avec succès !');
        this.chargerEncadrements(cid);
        setTimeout(() => this.encMsg.set(''), 3000);
      },
      error: err => this.handleError(err)
    });
  }

  retirerDoctorant(doctorantId: number) {
    const cid = this.chercheurId();
    if (!cid) return;
    this.api.updateDoctorant(doctorantId, { directeurId: null }).subscribe({
      next: () => {
        this.encMsg.set('Doctorant retiré.');
        this.chargerEncadrements(cid);
        setTimeout(() => this.encMsg.set(''), 3000);
      },
      error: err => this.handleError(err)
    });
  }

  assignerMasterien(masterienId: number) {
    const cid = this.chercheurId();
    if (!cid) return;
    this.api.updateMasterien(masterienId, { encadrantId: cid }).subscribe({
      next: () => {
        this.encMsg.set('Mastérien assigné avec succès !');
        this.chargerEncadrements(cid);
        setTimeout(() => this.encMsg.set(''), 3000);
      },
      error: err => this.handleError(err)
    });
  }

  retirerMasterien(masterienId: number) {
    const cid = this.chercheurId();
    if (!cid) return;
    this.api.updateMasterien(masterienId, { encadrantId: null }).subscribe({
      next: () => {
        this.encMsg.set('Mastérien retiré.');
        this.chargerEncadrements(cid);
        setTimeout(() => this.encMsg.set(''), 3000);
      },
      error: err => this.handleError(err)
    });
  }

  sauvegarderProfil() {
    const id = this.chercheurId();
    if (!id) { this.message.set('Profil introuvable.'); return; }
    this.api.patch(`chercheurs/${id}/profil`, this.editProfil).subscribe({
      next: () => {
        this.message.set('Profil mis à jour avec succès !');
        this.loadProfil();
      },
      error: err => this.handleError(err)
    });
  }

  ajouterPublication() {
    if (!this.newPub.titre.trim()) {
      this.message.set('Le titre est obligatoire.');
      return;
    }
    this.api.post('publications', this.newPub).subscribe({
      next: (pub: any) => {
        // §3.7.2 CDC — uploader le PDF si sélectionné
        if (this.newPubPdfFile) {
          this.api.uploadPdfPublication(pub.id, this.newPubPdfFile).subscribe({
            next: () => this.loadProfil(),
            error: () => this.loadProfil()
          });
        } else {
          this.loadProfil();
        }
        this.message.set(
          this.newPub.statut === 'SOUMIS'
            ? 'Publication soumise à validation !'
            : 'Publication enregistrée en brouillon !'
        );
        this.activeTab.set('publications');
        this.newPub = {
          titre: '', type: 'Journal', annee: new Date().getFullYear(),
          journal: '', resume: '', doi: '', lienUrl: '', statut: 'BROUILLON',
          scimagoQuartile: '', classementCORE: '', facteurImpact: null, snip: null, sourceClassement: ''
        };
        this.clearPdfSelection();
      },
      error: err => this.handleError(err)
    });
  }

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

  // ── Édition de publication ────────────────────────────────
  startEditPublication(p: any) {
    // Un chercheur ne peut éditer que ses brouillons
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
    this.activeTab.set('publications'); // reste sur l'onglet publications
  }

  saveEditPublication() {
    const p = this.editingPublication();
    if (!p) return;
    if (!p.titre?.trim()) { this.message.set('Le titre est obligatoire.'); return; }

    // Si l'utilisateur veut supprimer le PDF existant sans le remplacer
    if (this.editRemovePdf && !this.editPubPdfFile) {
      this.api.deletePdfPublication(p.id).subscribe({
        next: () => {},
        error: () => {} // non bloquant si le fichier n'existe plus
      });
      p.pdfUrl = null;
    }

    // Sanitize CHECK-constrained enum fields: the DB rejects empty strings —
    // they must be NULL when no value is selected.
    const { statut: _statut, ...rest } = p;
    const payload = {
      ...rest,
      scimagoQuartile: p.scimagoQuartile || null,
      classementCORE:  p.classementCORE  || null,
      facteurImpact:   p.facteurImpact   ?? null,
      snip:            p.snip            ?? null,
    };

    this.api.updatePublication(p.id, payload).subscribe({
      next: (saved: any) => {
        // Uploader le nouveau PDF si sélectionné
        if (this.editPubPdfFile) {
          this.api.uploadPdfPublication(p.id, this.editPubPdfFile).subscribe({
            next: () => {
              this.message.set('Publication mise à jour avec le nouveau PDF !');
              this.clearEditPdfSelection();
              this.editingPublication.set(null);
              this.loadProfil();
            },
            error: () => {
              this.message.set('Publication mise à jour, mais erreur lors de l\'upload PDF.');
              this.clearEditPdfSelection();
              this.editingPublication.set(null);
              this.loadProfil();
            }
          });
        } else {
          this.message.set('Publication mise à jour !');
          this.editingPublication.set(null);
          this.loadProfil();
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

  // ── Helpers PDF édition ───────────────────────────────────
  onEditPdfFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    if (this._editPdfBlobUrl) URL.revokeObjectURL(this._editPdfBlobUrl);
    this.editPubPdfFile = input.files[0];
    this._editPdfBlobUrl = URL.createObjectURL(this.editPubPdfFile);
    this.editPubPdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this._editPdfBlobUrl);
    this.editPdfViewerUrl.set(this.editPubPdfPreviewUrl);
    this.editRemovePdf = false; // un nouveau fichier annule la demande de suppression
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
      // Load the PDF via XHR as a blob and create an object URL to avoid cross-origin/embed issues.
      // Start with an empty safe URL and trigger a fetch — template will update when the blob is ready.
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

  soumettre(id: number) {
    this.api.patch(`publications/${id}/statut`, { statut: 'SOUMIS' }).subscribe({
      next: () => {
        this.message.set('Publication soumise à validation !');
        this.loadProfil();
      },
      error: err => this.handleError(err)
    });
  }

  retirerSoumission(id: number) {
    this.api.patch(`publications/${id}/statut`, { statut: 'BROUILLON' }).subscribe({
      next: () => {
        this.message.set('Publication remise en brouillon.');
        this.loadProfil();
      },
      error: err => this.handleError(err)
    });
  }

  getStatutClass(statut: string): string {
    if (statut === 'PUBLIE') return 'statut-publie';
    if (statut === 'SOUMIS') return 'statut-soumis';
    return 'statut-brouillon';
  }

  getStatutLabel(statut: string): string {
    if (statut === 'PUBLIE') return '✅ Publié';
    if (statut === 'SOUMIS') return '⏳ En attente';
    return '📝 Brouillon';
  }

  fermerTout() {
  this.message.set('');
  this.editingPublication.set(null);
  this.clearPdfSelection();
  this.clearEditPdfSelection();
  }
  
  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  navigateTo(path: string) {
    this.fermerTout();
    this.router.navigate([path]);
  }
}