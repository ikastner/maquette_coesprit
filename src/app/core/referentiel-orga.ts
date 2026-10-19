/** Listes de choix — organisation (fiche) */

export const PERIMETRES_TRAVAIL: string[] = [
  'Digital / SI',
  'Métier',
  'Transverse',
  'Pilotage / Projet',
  'Support',
  'National',
];

export const ENTITES_OPERATIONNELLES: string[] = [
  'IT',
  'Finance',
  'RH',
  'Production',
  'Juridique',
  'Communication',
  'DA3C',
  'DSI',
];

export const LIBELLES_POSTE: string[] = [
  'Chef de projet',
  'Chef de projet SI',
  'Chef de projet data',
  'Chef de projet métier',
  'Pilote de communauté',
  'Architecte applicatif',
  'Chargé de conduite du changement',
  'Référent méthodes',
  'Référent outillage collaboratif',
  'Analyste risques projet',
  'Chargé de reporting',
  'Chargé de faisabilité',
];

export type SelectOption = { label: string; value: string };

export function toSelectOptions(values: string[]): SelectOption[] {
  return values.map((v) => ({ label: v, value: v }));
}
