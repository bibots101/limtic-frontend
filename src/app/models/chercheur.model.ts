// ─────────────────────────────────────────────────────────────────────────────
// Modèles TypeScript — synchronisés avec les entités Java corrigées
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  role: string;
}

export interface AxeRecherche {
  id: number;
  nom: string;
  description: string;
  responsable?: {
    id: number; nom: string; prenom: string;
    grade: string; institution?: string; specialite?: string;
  };
  chercheurs?: {
    id: number; nom: string; prenom: string;
    grade: string; institution?: string; specialite?: string;
  }[];
}

// ── §3.7 — Champs de classement ajoutés ──────────────────────────────────────
export interface Publication {
  id: number;
  titre: string;
  type: string;               // "Journal" | "Conference" | "Book Chapter" | "Thesis"
  annee: number;
  journal?: string;
  resume?: string;
  lienUrl?: string;
  doi?: string;
  pdfUrl?: string;
  motsCles?: string;
  statut?: 'BROUILLON' | 'SOUMIS' | 'PUBLIE';

  // Champs de classement réels (§3.7 CDC)
  facteurImpact?: number;
  scimagoQuartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  snip?: number;
  classementCORE?: 'A*' | 'A' | 'B' | 'C';

  // Aliases used in templates
  classement?: string;         // ← ADD THIS
  sourceClassement?: string;   // ← ADD THIS

  axe?: AxeRecherche;
  chercheurs?: { id: number; nom: string; prenom: string; grade?: string }[];
  chercheur?: { id: number; nom: string; prenom: string; grade?: string };  // ← ADD THIS
}

export interface Chercheur {
  id: number;
  user?: User;
  nom: string;
  prenom: string;
  grade?: string;
  institution?: string;
  specialite?: string;
  photoUrl?: string;
  cvUrl?: string;
  bureau?: string;
  telephone?: string;
  biographie?: string;
  googleScholar?: string;
  researchGate?: string;
  orcid?: string;
  linkedin?: string;
  statut?: string;
  publications?: Publication[];
  axes?: AxeRecherche[];
}

// ── Galerie photos événements ─────────────────────────────────────────────────
export interface PhotoEvenement {
  id: number;
  url: string;
  legende?: string;
  ordre: number;
}

export interface Intervenant {
  id: number;
  nom: string;
  prenom?: string;
  affiliation?: string;
  titrePresentation?: string;
  email?: string;
  photoUrl?: string;
}

export interface Evenement {
  id: number;
  titre: string;
  dateEvenement: string;
  dateFin?: string;
  lieu?: string;
  description?: string;
  type?: string;
  statut?: 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
  programmeUrl?: string;
  programmeTexte?: string;
  photos?: PhotoEvenement[];        // ← galerie photos
  intervenants?: Intervenant[];     // ← intervenants invités
}

export interface Doctorant {
  id: number;
  nom: string;
  prenom: string;
  sujetThese?: string;
  directeur?: {
    id: number; nom: string; prenom: string;
    grade?: string; institution?: string; specialite?: string;
  };
  dateInscription?: string;
  dateSoutenance?: string;
  statut?: string;
  mention?: string;
  photoUrl?: string;
  axeRecherche?: AxeRecherche;
  publications?: Publication[];
}

export interface Masterien {
  id: number;
  nom: string;
  prenom: string;
  sujetMemoire?: string;
  encadrant?: {
    id: number; nom: string; prenom: string;
    grade?: string; institution?: string; specialite?: string;
  };
  promotion?: string;
  statut?: string;
  axeRecherche?: AxeRecherche;
}

export interface Outil {
  id: number;
  nom: string;
  description: string;
  lienGithub: string;
  type: string;
  statut: string;
}

// ── Paramètres système (§4.3.6) ───────────────────────────────────────────────
export interface ParametreSysteme {
  id: number;
  cle: string;
  valeur: string;
  description?: string;
  groupe?: string;
  sensible?: boolean;
}

// ── Journal d'audit (§4.1) ────────────────────────────────────────────────────
export interface AuditLog {
  id: number;
  userEmail?: string;
  action: string;
  entite?: string;
  entiteId?: number;
  details?: string;
  ipAddress?: string;
  dateAction: string;
  succes: boolean;
}
