/** Domaines du référentiel d’appétences (fiche-screen-v2 + espace pilote) */

export type AideChipTone = 'sky' | 'mint' | 'lilac' | 'peach' | 'sand' | 'aqua';

export type AideIcon =
  | 'shield'
  | 'people'
  | 'chat'
  | 'doc'
  | 'brain'
  | 'loop'
  | 'flow'
  | 'chart'
  | 'laptop'
  | 'change'
  | 'hands'
  | 'star';

export interface AideDomaine {
  id: string;
  label: string;
  tone: AideChipTone;
}

export const AIDE_DOMAINES: AideDomaine[] = [
  { id: 'gce', label: 'GCE', tone: 'sky' },
  { id: 'gci', label: 'GCI', tone: 'mint' },
  { id: 'raf', label: 'RAF', tone: 'lilac' },
  { id: 'projet', label: 'Projet', tone: 'peach' },
  { id: 'processus', label: 'Processus', tone: 'sand' },
  { id: 'outils', label: 'Outils / SI', tone: 'aqua' },
];

export function domaineLabel(id: string | null | undefined): string {
  if (!id) return '—';
  return AIDE_DOMAINES.find((d) => d.id === id)?.label ?? id;
}
