import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../../services/api.service';
import { Evenement, PhotoEvenement } from '../../models/chercheur.model';

@Component({
  selector: 'app-evenement-detail',
  imports: [CommonModule],
  templateUrl: './evenement-detail.html',
  styleUrl: './evenement-detail.css'
})
export class EvenementDetail implements OnInit {
  private api       = inject(ApiService);
  private route     = inject(ActivatedRoute);
  private router    = inject(Router);
  private sanitizer = inject(DomSanitizer);

  evenement       = signal<Evenement | null>(null);
  isAdmin         = false;

  // Galerie
  photoActive     = signal<PhotoEvenement | null>(null);
  photoActiveIdx  = signal(0);
  uploading       = signal(false);
  uploadErreur    = signal('');

  // Drag-drop ordre photos
  dragIndex       = signal<number | null>(null);

  ngOnInit() {
    const id    = Number(this.route.snapshot.paramMap.get('id'));
    this.isAdmin = localStorage.getItem('role') === 'ADMIN';
    this.chargerEvenement(id);
  }

  private normalizePhoto(img: any): PhotoEvenement {
    const url = img.url && !img.url.startsWith('http')
      ? this.api.getUploadUrl(img.url)
      : img.url;
    return { ...img, url };
  }

  private normalizeEvenement(data: any): Evenement {
    return {
      ...data,
      photos: (data.photos ?? []).map((img: any) => this.normalizePhoto(img)),
      intervenants: data.intervenants ?? []
    };
  }

  private chargerEvenement(id: number) {
    this.api.getEvenement(id).subscribe(data => {
      const normalized = this.normalizeEvenement(data);
      this.evenement.set(normalized);
      if (normalized.photos?.length) {
        this.photoActive.set(normalized.photos[0]);
        this.photoActiveIdx.set(0);
      }
    });
  }

  getStatutEvenement(start: string, end?: string, statutField?: string): 'avenir' | 'passe' | 'annule' {
    if (statutField === 'ANNULE') {
      return 'annule';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fin = end ? new Date(end) : new Date(start);
    return fin >= today ? 'avenir' : 'passe';
  }

  statutLabel(start: string, end?: string, statutField?: string): string {
    const statut = this.getStatutEvenement(start, end, statutField);
    if (statut === 'annule') return 'Annulé';
    return statut === 'avenir' ? 'À venir' : 'Passé';
  }

  // ── Lightbox ───────────────────────────────────────────────────────────────
  ouvrirPhoto(idx: number) {
    const photos = this.evenement()?.photos ?? [];
    this.photoActive.set(photos[idx]);
    this.photoActiveIdx.set(idx);
  }

  photoSuivante() {
    const photos = this.evenement()?.photos ?? [];
    const next   = (this.photoActiveIdx() + 1) % photos.length;
    this.photoActive.set(photos[next]);
    this.photoActiveIdx.set(next);
  }

  photoPrecedente() {
    const photos = this.evenement()?.photos ?? [];
    const prev   = (this.photoActiveIdx() - 1 + photos.length) % photos.length;
    this.photoActive.set(photos[prev]);
    this.photoActiveIdx.set(prev);
  }

  fermerLightbox() {
    this.photoActive.set(null);
  }

  // ── Upload multiple photos ─────────────────────────────────────────────────
  onFichiersSelectionnes(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files);
    this.uploadPhotos(files);
    input.value = '';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length) this.uploadPhotos(files);
  }

  onDragOver(event: DragEvent) { event.preventDefault(); }

  private uploadPhotos(files: File[]) {
    const id = this.evenement()?.id;
    if (!id) return;

    // Valider côté client avant l'envoi
    const exts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    for (const f of files) {
      const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
      if (!exts.includes(ext)) {
        this.uploadErreur.set(`Format non supporté : ${f.name}. Formats acceptés : JPG, PNG, WebP, GIF`);
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        this.uploadErreur.set(`Fichier trop lourd (max 5 Mo) : ${f.name}`);
        return;
      }
    }

    this.uploading.set(true);
    this.uploadErreur.set('');

    this.api.uploadPhotosEvenement(id, files).subscribe({
      next: () => {
        this.chargerEvenement(id);
        this.uploading.set(false);
      },
      error: err => {
        this.uploadErreur.set(err?.error?.error ?? 'Erreur lors de l\'upload.');
        this.uploading.set(false);
      }
    });
  }

  // ── Suppression photo ──────────────────────────────────────────────────────
  supprimerPhoto(photo: PhotoEvenement) {
    if (!confirm('Supprimer cette photo ?')) return;
    const evtId = this.evenement()?.id!;
    this.api.deletePhotoEvenement(evtId, photo.id).subscribe({
      next: () => {
        this.chargerEvenement(evtId);
        this.fermerLightbox();
      }
    });
  }

  // ── Drag-drop réordonnancement ─────────────────────────────────────────────
  onDragStartPhoto(idx: number) { this.dragIndex.set(idx); }

  onDropPhoto(event: DragEvent, targetIdx: number) {
    event.preventDefault();
    const fromIdx = this.dragIndex();
    if (fromIdx === null || fromIdx === targetIdx) return;

    const photos = [...(this.evenement()?.photos ?? [])];
    const [moved] = photos.splice(fromIdx, 1);
    photos.splice(targetIdx, 0, moved);

    // Mettre à jour les ordres
    const ordres = photos.map((p, i) => ({ id: p.id, ordre: i }));
    this.api.updateOrdrePhotos(this.evenement()!.id, ordres).subscribe({
      next: () => this.chargerEvenement(this.evenement()!.id)
    });
    this.dragIndex.set(null);
  }

  safeHtml(html: string | undefined): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(html ?? '');
  }

  retour() { this.router.navigate(['/evenements']); }
}
