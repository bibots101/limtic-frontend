import { Component, OnInit, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Outil } from '../../models/chercheur.model';
import { LabSettingsService } from '../../services/lab-settings.service';

@Component({
  selector: 'app-outils',
  imports: [],
  templateUrl: './outils.html',
  styleUrl: './outils.css'
})
export class Outils implements OnInit {
  outils = signal<Outil[]>([]);

  constructor(private api: ApiService, public settings: LabSettingsService) {}

  ngOnInit() {
    this.api.getOutils().subscribe(data => this.outils.set(data));
  }
}
