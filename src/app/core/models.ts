export type DemoRole = 'membre' | 'pilote' | 'admin';
export type TermeStatut = 'propose' | 'valide' | 'refuse' | 'archive';

export interface Communaute {
  id: string;
  code: string;
  libelle: string;
  active: boolean;
}

export interface MembreCommunaute {
  userId: string;
  communauteId: string;
  roleLocal: 'membre' | 'pilote';
  actif: boolean;
}

export interface ReferentielTerme {
  id: string;
  communauteId: string;
  libelle: string;
  statut: TermeStatut;
  /** Domaine métier — requis à la validation pilote */
  domaineId: string | null;
  /** Icône affichage fiche (optionnel) */
  icon?: string;
}

export interface Fiche {
  userId: string;
  nomAffiche: string;
  mailSi: string;
  site: string;
  perimetre: string;
  /** Entités opérationnelles (sélection multiple) */
  entiteOperationnelle: string[];
  /** Libellé du poste (liste ou saisie libre) */
  libellePoste: string;
  /** Description libre du quotidien */
  activitesPrincipales: string;
  sujetsAide: string;
  passions: string;
  canalMail: string;
  canalTeams: string;
  /** Appétences validées du référentiel cochées sur la fiche */
  termeIds: string[];
  /** Dernière mise à jour de la fiche (ISO) */
  updatedAt: string;
  /** Photo de profil (data URL ou URL) — optionnelle */
  photoUrl?: string | null;
}

export interface DemoUser {
  id: string;
  nom: string;
  mail: string;
  roleWham: DemoRole;
  site: string;
  perimetre: string;
  entite: string[];
}

export interface SessionState {
  userId: string;
  role: DemoRole;
}
