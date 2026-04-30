import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LabSettingsService } from '../../services/lab-settings.service';

@Component({
  selector: 'app-masteriens',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './masteriens.html',
  styleUrl: './masteriens.css'
})
export class Masteriens implements OnInit {
  all      = signal<any[]>([]);
  filtered = signal<any[]>([]);
  loading  = signal(true);

  filterEncadrant = '';
  filterStatut    = '';
  filterPromotion = '';

  constructor(private api: ApiService, public settings: LabSettingsService) {}

  ngOnInit() {
    this.api.getMasteriens().subscribe({
      next: (data) => { this.all.set(data); this.applyFilters(); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  applyFilters() {
    let data = this.all();
    if (this.filterEncadrant)
      data = data.filter(m =>
        m.encadrant && `${m.encadrant.prenom} ${m.encadrant.nom}`
          .toLowerCase().includes(this.filterEncadrant.toLowerCase()));
    if (this.filterStatut)
      data = data.filter(m => m.statut === this.filterStatut);
    if (this.filterPromotion)
      data = data.filter(m =>
        m.promotion && m.promotion.toLowerCase().includes(this.filterPromotion.toLowerCase()));
    this.filtered.set(data);
  }

  resetFilters() {
    this.filterEncadrant = '';
    this.filterStatut    = '';
    this.filterPromotion = '';
    this.applyFilters();
  }

  getInitials(m: any): string {
    return `${m.prenom?.[0] || ''}${m.nom?.[0] || ''}`.toUpperCase();
  }
}
