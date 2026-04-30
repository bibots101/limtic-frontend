import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { Publication } from '../../models/chercheur.model';
import { SafePipe } from '../../pipes/Safepipe';

@Component({
  selector: 'app-publication-detail',
  imports: [CommonModule, SafePipe],
  templateUrl: './publication-detail.html',
  styleUrl: './publication-detail.css'
})
export class PublicationDetail implements OnInit, OnDestroy {
  publication = signal<Publication | null>(null);
  pdfBlobUrl = signal<string | null>(null);
  pdfLoading = signal(false);
  pdfError = signal(false);

  private blobUrl: string | null = null;

  constructor(
    private api: ApiService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.api.getPublications().subscribe((publications: Publication[]) => {
      const pub = publications.find(p => p.id === id);
      if (pub) {
        this.publication.set(pub);
        if (pub.pdfUrl) {
          this.loadPdfBlob(pub.pdfUrl);
        }
      } else {
        this.router.navigate(['/publications']);
      }
    });
  }

  loadPdfBlob(pdfPath: string) {
    this.pdfLoading.set(true);
    this.pdfError.set(false);

    this.http.get('https://localhost:8443' + pdfPath, {
      responseType: 'blob',
      withCredentials: true
    }).subscribe({
      next: (blob) => {
        // Revoke previous blob URL to avoid memory leaks
        if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
        this.blobUrl = URL.createObjectURL(blob);
        this.pdfBlobUrl.set(this.blobUrl);
        this.pdfLoading.set(false);
      },
      error: () => {
        this.pdfError.set(true);
        this.pdfLoading.set(false);
      }
    });
  }

  ngOnDestroy() {
    // Clean up the blob URL when leaving the page
    if (this.blobUrl) URL.revokeObjectURL(this.blobUrl);
  }

  retour() { this.router.navigate(['/publications']); }
  navigateToChercheur(id: number) { this.router.navigate(['/chercheurs', id]); }
  navigateToAxe(id: number) { this.router.navigate(['/axes', id]); }
}