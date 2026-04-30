import {
  Component, OnInit, OnDestroy, signal, computed, inject
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';

export type StatutEvenement = 'A_VENIR' | 'EN_COURS' | 'TERMINE';

export interface ImageEvenement {
  id?:      number;
  url:      string;
  legende:  string;
  ordre:    number;
  file?:    File;
  preview?: string;
}

export interface Intervenant {
  id?: number;
  prenom?: string;
  nom: string;
  affiliation?: string;
  titrePresentation?: string;
}

export interface Evenement {
  id?:           number;
  titre:         string;
  description:   string;
  dateEvenement: string;
  dateFin:       string;
  lieu:          string;
  type?:         string;
  programmeUrl?: string;
  programmeTexte?: string;
  statut:        StatutEvenement;
  photos?:       ImageEvenement[];
  images:        ImageEvenement[];
  intervenants?: Intervenant[];
}

@Component({
  selector: 'app-admin-evenements',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './admin-evenements.component.html',
  styleUrl:    './admin-evenements.component.css'
})
export class AdminEvenementsComponent implements OnInit, OnDestroy {

  private sanitizer = inject(DomSanitizer);
  private api       = inject(ApiService);

  // ── liste ──────────────────────────────────────────────────────────
  evenements    = signal<Evenement[]>([]);
  loading       = signal(true);
  filtreStatut  = signal<StatutEvenement | ''>('');

  evenementsFiltres = computed(() => {
    const f = this.filtreStatut();
    return f
      ? this.evenements().filter(e => this.statutCalcule(e) === f)
      : this.evenements();
  });

  // ── modal ──────────────────────────────────────────────────────────
  modalOuvert    = signal(false);
  modeEdition    = signal(false);
  enregistrement = signal(false);
  form: Evenement = this.formVide();

  // ── Quill ──────────────────────────────────────────────────────────
  private quillInstance: any = null;
  private quillProgrammeInstance: any = null;

  // ── drag & drop ────────────────────────────────────────────────────
  dragIndex:     number | null = null;
  dragOverIndex: number | null = null;

  // ── suppression ────────────────────────────────────────────────────
  confirmSupprId: number | null = null;

  // ══════════════════════════════════════════════════════════════════
  ngOnInit()    { this.chargerEvenements(); this.chargerQuill(); }
  ngOnDestroy() { this.quillInstance = null; }

  // ── données ────────────────────────────────────────────────────────
  private normalizeImage(img: any): ImageEvenement {
    const url = img.url && !img.url.startsWith('http')
      ? this.api.getUploadUrl(img.url)
      : img.url;
    return { ...img, url };
  }

  private normalizeEvenement(data: any): Evenement {
    return {
      ...data,
      images: (data.photos ?? data.images ?? []).map((img: any) => this.normalizeImage(img)),
      intervenants: data.intervenants ?? []
    };
  }

  private buildPayloadForSave(event: Evenement) {
    const { images, ...rest } = event as any;
    return {
      ...rest,
      photos: event.images
        .filter(img => !img.file)
        .map(({ id, url, legende, ordre }) => ({ id, url, legende, ordre }))
    };
  }

  private commitSavedEvent(saved: Evenement) {
    this.evenements.update(list =>
      this.modeEdition()
        ? list.map(e => e.id === saved.id ? saved : e)
        : [saved, ...list]
    );
    this.fermerModal();
    this.enregistrement.set(false);
  }

  ajouterIntervenant() {
    this.form.intervenants = [...(this.form.intervenants ?? []), {
      id: undefined,
      nom: '',
      prenom: '',
      affiliation: '',
      titrePresentation: ''
    }];
  }

  supprimerIntervenant(index: number) {
    this.form.intervenants = this.form.intervenants?.filter((_, i) => i !== index) ?? [];
  }

  chargerEvenements() {
    this.loading.set(true);
    this.api.getEvenements().subscribe({
      next: (data) => {
        const normalized = data.map((e: any) => this.normalizeEvenement(e));
        this.evenements.set(normalized);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // ── statut automatique selon la date ──────────────────────────────
  statutCalcule(e: Evenement): StatutEvenement {
    const now   = new Date();
    const debut = new Date(e.dateEvenement);
    const fin   = new Date(e.dateFin);
    if (now < debut)               return 'A_VENIR';
    if (now >= debut && now <= fin) return 'EN_COURS';
    return 'TERMINE';
  }

  labelStatut(s: StatutEvenement) {
    return { A_VENIR: 'À venir', EN_COURS: 'En cours', TERMINE: 'Terminé' }[s];
  }

  // ── modal ──────────────────────────────────────────────────────────
  ouvrirCreation() {
    this.form = this.formVide();
    this.modeEdition.set(false);
    this.modalOuvert.set(true);
    setTimeout(() => {
      this.initQuill('', 'quill-editor', 'description');
      this.initQuill('', 'quill-programme', 'programmeTexte');
    }, 60);
  }

  ouvrirEdition(e: Evenement) {
    this.form = this.normalizeEvenement(e);
    this.modeEdition.set(true);
    this.modalOuvert.set(true);
    setTimeout(() => {
      this.initQuill(this.form.description, 'quill-editor', 'description');
      this.initQuill(this.form.programmeTexte ?? '', 'quill-programme', 'programmeTexte');
    }, 60);
  }

  fermerModal() { this.modalOuvert.set(false); this.quillInstance = null; this.quillProgrammeInstance = null; }

  // ── Quill (chargé dynamiquement) ──────────────────────────────────
  private chargerQuill() {
    if ((window as any).Quill) return;
    const link   = document.createElement('link');
    link.rel     = 'stylesheet';
    link.href    = 'https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src   = 'https://cdn.jsdelivr.net/npm/quill@2/dist/quill.js';
    document.head.appendChild(script);
  }

  private initQuill(contenu = '', containerId = 'quill-editor', formField: 'description' | 'programmeTexte' = 'description') {
    if (!(window as any).Quill) { setTimeout(() => this.initQuill(contenu, containerId, formField), 200); return; }
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';
    const instance = new (window as any).Quill(`#${containerId}`, {
      theme: 'snow',
      modules: { toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'link'],
        [{ align: [] }],
        ['clean']
      ]}
    });
    if (contenu) instance.clipboard.dangerouslyPasteHTML(contenu);
    instance.on('text-change', () => {
      (this.form as any)[formField] = instance.root.innerHTML;
    });

    if (formField === 'description') {
      this.quillInstance = instance;
    } else {
      this.quillProgrammeInstance = instance;
    }
  }

  safeHtml(html: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // ── upload images ─────────────────────────────────────────────────
  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.form.images.push({
          url: '', legende: '',
          ordre:   this.form.images.length,
          file,
          preview: e.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  supprimerImage(i: number) {
    this.form.images.splice(i, 1);
    this.form.images.forEach((img, idx) => img.ordre = idx);
  }

  // ── drag & drop images ────────────────────────────────────────────
  onDragStart(i: number)               { this.dragIndex = i; }
  onDragOver(ev: DragEvent, i: number) { ev.preventDefault(); this.dragOverIndex = i; }
  onDragEnd()                          { this.dragIndex = null; this.dragOverIndex = null; }
  onDrop(i: number) {
    if (this.dragIndex === null || this.dragIndex === i) return;
    const imgs = [...this.form.images];
    const [moved] = imgs.splice(this.dragIndex, 1);
    imgs.splice(i, 0, moved);
    this.form.images = imgs;
    this.form.images.forEach((img, idx) => img.ordre = idx);
    this.dragIndex = null; this.dragOverIndex = null;
  }

  // ── enregistrement ────────────────────────────────────────────────
  enregistrer() {
    if (!this.form.titre || !this.form.dateEvenement || !this.form.dateFin) return;
    this.form.statut = this.statutCalcule(this.form);
    this.enregistrement.set(true);

    const payload = this.buildPayloadForSave(this.form);
    const obs = this.modeEdition()
      ? this.api.updateEvenement(this.form.id!, payload)
      : this.api.createEvenement(payload);

    obs.subscribe({
      next: (saved) => {
        const savedNormalized = this.normalizeEvenement(saved);
        const newFiles = this.form.images.filter(img => img.file).map(img => img.file!);

        if (newFiles.length && savedNormalized.id) {
          this.api.uploadPhotosEvenement(savedNormalized.id, newFiles).subscribe({
            next: (uploaded: any[]) => {
              const uploadedNormalized = uploaded.map((img: any) => this.normalizeImage(img));
              savedNormalized.images = [...savedNormalized.images, ...uploadedNormalized];
              this.commitSavedEvent(savedNormalized);
            },
            error: () => this.enregistrement.set(false)
          });
        } else {
          this.commitSavedEvent(savedNormalized);
        }
      },
      error: () => this.enregistrement.set(false)
    });
  }

  // ── suppression ───────────────────────────────────────────────────
  demanderSuppression(id: number)  { this.confirmSupprId = id; }
  annulerSuppression()             { this.confirmSupprId = null; }
  confirmerSuppression() {
    const id = this.confirmSupprId!;
    this.api.deleteEvenement(id).subscribe(() => {
      this.evenements.update(l => l.filter(e => e.id !== id));
      this.confirmSupprId = null;
    });
  }

  private formVide(): Evenement {
    const today = new Date().toISOString().split('T')[0];
    return {
      titre: '', description: '', lieu: '', type: '', programmeUrl: '', programmeTexte: '',
      dateEvenement: today, dateFin: today,
      statut: 'A_VENIR', images: [], intervenants: []
    };
  }

  trackById(_: number, e: Evenement)         { return e.id; }
  trackByOrdre(_: number, i: ImageEvenement) { return i.ordre; }
}