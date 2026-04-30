import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-doctorant-detail',
  imports: [CommonModule],
  templateUrl: './doctorant-detail.html',
  styleUrl: './doctorant-detail.css'
})
export class DoctorantDetail implements OnInit {
  doctorant = signal<any | null>(null);

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getDoctorants().subscribe((data: any[]) => {
      const doc = data.find(d => d.id === id);
      if (doc) {
        this.doctorant.set(doc);
      } else {
        this.router.navigate(['/doctorants']);
      }
    });
  }

  retour() { this.router.navigate(['/doctorants']); }

  navigateToChercheur(id: number) {
    this.router.navigate(['/chercheurs', id]);
  }

  navigateToPublication(id: number) {
    this.router.navigate(['/publications', id]);
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}