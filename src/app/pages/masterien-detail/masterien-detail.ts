import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Masterien } from '../../models/chercheur.model';

@Component({
  selector: 'app-masterien-detail',
  imports: [CommonModule],
  templateUrl: './masterien-detail.html',
  styleUrl: './masterien-detail.css'
})
export class MasterienDetail implements OnInit {
  masterien = signal<Masterien | null>(null);

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.api.getMasteriens().subscribe((masteriens: Masterien[]) => {
      const mst = masteriens.find(m => m.id === id);
      if (mst) {
        this.masterien.set(mst);
      } else {
        this.router.navigate(['/masteriens']);
      }
    });
  }

  retour() { this.router.navigate(['/masteriens']); }

  navigateToChercheur(id: number) {
    this.router.navigate(['/chercheurs', id], { queryParams: { from: 'masterien-detail' } });
  }

  navigateToAxe(id: number) {
    this.router.navigate(['/axes', id]);
  }

  formatDate(date: string | Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
}
