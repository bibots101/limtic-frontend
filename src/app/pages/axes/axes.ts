import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AxeRecherche, Publication } from '../../models/chercheur.model';
import { LabSettingsService } from '../../services/lab-settings.service';

@Component({
  selector: 'app-axes',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './axes.html',
  styleUrl: './axes.css'
})
export class Axes implements OnInit {
  axes = signal<AxeRecherche[]>([]);
  publicationsByAxe = signal<Record<number, Publication[]>>({});
  expandedAxeId = signal<number | null>(null);
  loading = signal(true);

  constructor(private api: ApiService, public settings: LabSettingsService) {}

  ngOnInit() {
    this.api.getAxes().subscribe({
      next: (data) => {
        this.axes.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  /** Ouvre/ferme le panneau publications d'un axe */
  togglePublications(axeId: number) {
    if (this.expandedAxeId() === axeId) {
      this.expandedAxeId.set(null);
      return;
    }
    this.expandedAxeId.set(axeId);
    // Charger les publications seulement si pas encore chargées
    if (!this.publicationsByAxe()[axeId]) {
      this.api.getPublicationsByAxe(axeId).subscribe((pubs: Publication[]) => {
        this.publicationsByAxe.update(map => ({ ...map, [axeId]: pubs }));
      });
    }
  }

  getPublications(axeId: number): Publication[] {
    return this.publicationsByAxe()[axeId] ?? [];
  }

  isExpanded(axeId: number): boolean {
    return this.expandedAxeId() === axeId;
  }
}
