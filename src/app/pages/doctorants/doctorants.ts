import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { LabSettingsService } from '../../services/lab-settings.service';

@Component({
  selector: 'app-doctorants',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './doctorants.html',
  styleUrl: './doctorants.css'
})
export class Doctorants implements OnInit {
  all       = signal<any[]>([]);
  filtered  = signal<any[]>([]);
  axesList  = signal<any[]>([]);
  loading   = signal(true);

  filterDirecteur = '';
  filterStatut    = '';
  filterAnnee     = '';
  filterAxe       = '';

  // Noms des axes pour le <select>
  axes = computed(() => this.axesList().map(a => a.nom).sort());

  constructor(private api: ApiService, public settings: LabSettingsService) {}

  ngOnInit() {
    this.api.getAxes().subscribe(axes => this.axesList.set(axes));

    this.api.getDoctorants().subscribe({
      next: (data) => {
        this.all.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  applyFilters() {
    let data = this.all();

    if (this.filterDirecteur)
      data = data.filter(d =>
        d.directeur && `${d.directeur.prenom} ${d.directeur.nom}`
          .toLowerCase().includes(this.filterDirecteur.toLowerCase()));

    if (this.filterAxe) {
      // Trouver l'axe sélectionné et récupérer les IDs de ses chercheurs
      const axe = this.axesList().find(a => a.nom === this.filterAxe);
      const chercheurIds = new Set((axe?.chercheurs || []).map((c: any) => c.id));
      data = data.filter(d => d.directeur && chercheurIds.has(d.directeur.id));
    }

    if (this.filterStatut)
      data = data.filter(d => d.statut === this.filterStatut);

    if (this.filterAnnee)
      data = data.filter(d =>
        d.dateInscription && d.dateInscription.startsWith(this.filterAnnee));

    this.filtered.set(data);
  }

  resetFilters() {
    this.filterDirecteur = '';
    this.filterStatut    = '';
    this.filterAnnee     = '';
    this.filterAxe       = '';
    this.applyFilters();
  }

  getInitials(d: any): string {
    return `${d.prenom?.[0] || ''}${d.nom?.[0] || ''}`.toUpperCase();
  }
}