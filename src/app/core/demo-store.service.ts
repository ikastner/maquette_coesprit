import { Injectable, computed, signal } from '@angular/core';
import { COMMUNAUTES, FICHES, MEMBRES, TERMES, USERS } from './demo-data';
import {
  Communaute,
  DemoRole,
  DemoUser,
  Fiche,
  MembreCommunaute,
  ReferentielTerme,
  SessionState,
} from './models';
import { AIDE_DOMAINES, AideDomaine } from './poc-aide-catalog';
import { ENTITES_OPERATIONNELLES, LIBELLES_POSTE, PERIMETRES_TRAVAIL } from './referentiel-orga';

export interface SearchFilters {
  q: string;
  site: string;
  perimetre: string;
  entite: string;
  domaineId: string;
  termeId: string;
}

@Injectable({ providedIn: 'root' })
export class DemoStoreService {
  private readonly sessionSig = signal<SessionState | null>(this.readSession());
  private readonly membresSig = signal<MembreCommunaute[]>(structuredClone(MEMBRES));
  private readonly fichesSig = signal<Fiche[]>(structuredClone(FICHES));
  private readonly termesSig = signal<ReferentielTerme[]>(structuredClone(TERMES));
  private readonly communautesSig = signal<Communaute[]>(structuredClone(COMMUNAUTES));
  private readonly toastSig = signal<string | null>(null);

  readonly session = this.sessionSig.asReadonly();
  readonly toast = this.toastSig.asReadonly();
  readonly users = USERS;

  readonly currentUser = computed(() => {
    const s = this.sessionSig();
    return s ? USERS.find((u) => u.id === s.userId) ?? null : null;
  });

  readonly myCommunautes = computed(() => {
    const s = this.sessionSig();
    if (!s) return [] as Communaute[];
    return this.communautesForUser(s.userId);
  });

  communautesForUser(userId: string): Communaute[] {
    const ids = this.membresSig()
      .filter((m) => m.userId === userId && m.actif)
      .map((m) => m.communauteId);
    return this.communautesSig().filter((c) => c.active && ids.includes(c.id));
  }

  readonly myFiche = computed(() => {
    const s = this.sessionSig();
    if (!s) return null;
    return this.fichesSig().find((f) => f.userId === s.userId) ?? null;
  });

  readonly isPilote = computed(() => {
    const s = this.sessionSig();
    if (!s || (s.role !== 'pilote' && s.role !== 'admin')) return false;
    return this.membresSig().some(
      (m) => m.userId === s.userId && m.actif && m.roleLocal === 'pilote'
    );
  });

  readonly isAdmin = computed(() => this.sessionSig()?.role === 'admin');

  readonly canAccessApp = computed(() => {
    const s = this.sessionSig();
    if (!s) return false;
    if (s.role === 'admin') return true;
    return this.myCommunautes().length > 0;
  });

  login(userId: string, role: DemoRole): void {
    const user = USERS.find((u) => u.id === userId);
    if (!user) return;
    const state: SessionState = { userId, role };
    this.sessionSig.set(state);
    localStorage.setItem('coesprit.session', JSON.stringify(state));
    this.refreshSiSnapshot(userId);
    this.showToast(`Connecté en tant que ${user.nom} (${role})`);
  }

  logout(): void {
    this.sessionSig.set(null);
    localStorage.removeItem('coesprit.session');
  }

  showToast(message: string): void {
    this.toastSig.set(message);
    setTimeout(() => this.toastSig.set(null), 2800);
  }

  isFicheComplete(fiche: Fiche): boolean {
    // Appétence cochée (validée ou encore en proposition sur sa fiche)
    const hasAppetence = this.termesSurFiche(fiche.termeIds).length > 0;
    // Canaux = SI (toujours préremplis) — hors critères de saisie membre
    return hasAppetence && !!fiche.libellePoste.trim() && !!fiche.activitesPrincipales.trim();
  }

  /** Appétences validées = cochables sur toutes les fiches de la communauté */
  termesValidesForUser(userId: string): ReferentielTerme[] {
    const communauteIds = this.membresSig()
      .filter((m) => m.userId === userId && m.actif)
      .map((m) => m.communauteId);
    return this.termesSig().filter(
      (t) => t.statut === 'valide' && communauteIds.includes(t.communauteId)
    );
  }

  /** Filtre recherche : toutes les appétences actives (validées + proposées) */
  termesFiltrablesForUser(userId: string): ReferentielTerme[] {
    const communauteIds = this.membresSig()
      .filter((m) => m.userId === userId && m.actif)
      .map((m) => m.communauteId);
    return this.termesSig()
      .filter(
        (t) =>
          (t.statut === 'valide' || t.statut === 'propose') &&
          communauteIds.includes(t.communauteId)
      )
      .sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));
  }

  /**
   * Liste cochable sur une fiche : validées du référentiel
   * + ses propres propositions encore en attente (déjà sur sa fiche).
   */
  termesSelectionnablesPourFiche(userId: string, termeIds: string[]): ReferentielTerme[] {
    const valide = this.termesValidesForUser(userId);
    const pendingMine = this.termesSig().filter(
      (t) => t.statut === 'propose' && termeIds.includes(t.id)
    );
    const map = new Map<string, ReferentielTerme>();
    for (const t of [...valide, ...pendingMine]) map.set(t.id, t);
    return [...map.values()];
  }

  /** Termes affichés sur une fiche (ignore refuse / archive) */
  termesSurFiche(termeIds: string[]): ReferentielTerme[] {
    const set = new Set(termeIds);
    return this.termesSig().filter(
      (t) => set.has(t.id) && t.statut !== 'refuse' && t.statut !== 'archive'
    );
  }

  termesProposables(): ReferentielTerme[] {
    return this.termesSig().filter((t) => t.communauteId === 'c-da3c');
  }

  saveFiche(patch: Partial<Fiche>, opts?: { silent?: boolean; touch?: boolean }): void {
    const s = this.sessionSig();
    if (!s) return;
    const touch = opts?.touch !== false;
    const updatedAt = new Date().toISOString();
    this.fichesSig.update((list) =>
      list.map((f) => {
        if (f.userId !== s.userId) return f;
        const next = { ...f, ...patch, userId: s.userId };
        if (touch) next.updatedAt = updatedAt;
        return next;
      })
    );
    if (!opts?.silent) this.showToast('Fiche enregistrée');
  }

  /**
   * Proposition membre → créée en `propose` + renvoyée (id).
   * La fiche l’ajoute tout de suite ; la validation rend l’appétence
   * disponible pour les autres fiches.
   */
  proposeTerme(libelle: string, domaineId?: string | null): string | null {
    const clean = libelle.trim();
    if (!clean) return null;
    const domaine = domaineId?.trim() || null;

    const existingValide = this.termesSig().find(
      (t) =>
        t.communauteId === 'c-da3c' &&
        t.statut === 'valide' &&
        t.libelle.toLowerCase() === clean.toLowerCase()
    );
    if (existingValide) {
      this.showToast('Cette appétence existe déjà dans le référentiel');
      return existingValide.id;
    }

    const existingPropose = this.termesSig().find(
      (t) =>
        t.communauteId === 'c-da3c' &&
        t.statut === 'propose' &&
        t.libelle.toLowerCase() === clean.toLowerCase()
    );
    if (existingPropose) {
      this.showToast('Cette appétence existe déjà');
      return existingPropose.id;
    }

    const id = 't-' + Date.now();
    this.termesSig.update((list) => [
      ...list,
      {
        id,
        communauteId: 'c-da3c',
        libelle: clean,
        statut: 'propose',
        domaineId: domaine,
        icon: 'star',
      },
    ]);
    this.showToast('Appétence ajoutée à ta fiche');
    return id;
  }

  setTermeStatut(id: string, statut: ReferentielTerme['statut']): void {
    this.termesSig.update((list) =>
      list.map((t) => {
        if (t.id !== id) return t;
        if (statut === 'refuse' || statut === 'archive') {
          return { ...t, statut, domaineId: statut === 'refuse' ? null : t.domaineId };
        }
        return { ...t, statut };
      })
    );
    if (statut === 'refuse' || statut === 'archive') {
      this.retirerTermeDesFiches(id);
    }
    this.showToast(
      statut === 'refuse'
        ? 'Proposition refusée — retirée des fiches'
        : `Appétence « ${statut} »`
    );
  }

  /** Validation pilote : disponible ensuite pour toutes les fiches */
  validerTerme(id: string, domaineId: string): void {
    const domaine = domaineId.trim();
    if (!domaine) {
      this.showToast('Choisis un domaine pour valider');
      return;
    }
    this.termesSig.update((list) =>
      list.map((t) =>
        t.id === id ? { ...t, statut: 'valide' as const, domaineId: domaine } : t
      )
    );
    this.showToast('Appétence validée — disponible pour toutes les fiches');
  }

  private retirerTermeDesFiches(termeId: string): void {
    this.fichesSig.update((list) =>
      list.map((f) =>
        f.termeIds.includes(termeId)
          ? { ...f, termeIds: f.termeIds.filter((id) => id !== termeId) }
          : f
      )
    );
  }

  setTermeDomaine(id: string, domaineId: string): void {
    const domaine = domaineId.trim();
    if (!domaine) return;
    this.termesSig.update((list) =>
      list.map((t) => (t.id === id ? { ...t, domaineId: domaine } : t))
    );
    this.showToast('Domaine mis à jour');
  }

  searchProfiles(filters: SearchFilters): Fiche[] {
    const s = this.sessionSig();
    if (!s) return [];
    const myIds = new Set(this.myCommunautes().map((c) => c.id));
    if (!myIds.size && s.role !== 'admin') return [];

    const memberUserIds = new Set(
      this.membresSig()
        .filter((m) => m.actif && myIds.has(m.communauteId))
        .map((m) => m.userId)
    );

    const q = this.normalize(filters.q);
    return this.fichesSig().filter((f) => {
      if (!memberUserIds.has(f.userId)) return false;
      if (filters.site && f.site !== filters.site) return false;
      if (filters.perimetre && f.perimetre !== filters.perimetre) return false;
      if (filters.entite && !f.entiteOperationnelle.includes(filters.entite)) return false;
      if (filters.termeId && !f.termeIds.includes(filters.termeId)) return false;
      if (filters.domaineId) {
        const domaines = this.domainesPourFiche(f.termeIds).map((d) => d.id);
        if (!domaines.includes(filters.domaineId)) return false;
      }
      if (!q) return true;
      const termes = this.termesSurFiche(f.termeIds);
      const domaineLabels = this.domainesPourFiche(f.termeIds).map((d) => d.label);
      const hay = this.normalize(
        [
          f.nomAffiche,
          f.libellePoste,
          f.activitesPrincipales,
          f.sujetsAide,
          f.passions,
          f.site,
          f.perimetre,
          ...f.entiteOperationnelle,
          ...termes.map((t) => t.libelle),
          ...domaineLabels,
        ].join(' ')
      );
      return hay.includes(q);
    });
  }

  /** Domaines couverts par les appétences d’une fiche (ordre catalogue) */
  domainesPourFiche(termeIds: string[]): AideDomaine[] {
    const ids = new Set(
      this.termesSurFiche(termeIds)
        .map((t) => t.domaineId)
        .filter((id): id is string => !!id)
    );
    return AIDE_DOMAINES.filter((d) => ids.has(d.id));
  }

  getFiche(userId: string): Fiche | null {
    return this.fichesSig().find((f) => f.userId === userId) ?? null;
  }

  canViewFiche(userId: string): boolean {
    const s = this.sessionSig();
    if (!s) return false;
    if (s.userId === userId) return true;
    const myIds = new Set(this.myCommunautes().map((c) => c.id));
    return this.membresSig().some(
      (m) => m.userId === userId && m.actif && myIds.has(m.communauteId)
    );
  }

  membresDa3c(): Array<MembreCommunaute & { user: DemoUser; fiche?: Fiche }> {
    return this.membresSig()
      .filter((m) => m.communauteId === 'c-da3c')
      .map((m) => ({
        ...m,
        user: USERS.find((u) => u.id === m.userId)!,
        fiche: this.fichesSig().find((f) => f.userId === m.userId),
      }))
      .filter((m) => !!m.user);
  }

  candidatsHorsCommunaute(): DemoUser[] {
    const inDa3c = new Set(
      this.membresSig()
        .filter((m) => m.communauteId === 'c-da3c' && m.actif)
        .map((m) => m.userId)
    );
    return USERS.filter((u) => !inDa3c.has(u.id));
  }

  addMembre(userId: string): void {
    const existing = this.membresSig().find(
      (m) => m.userId === userId && m.communauteId === 'c-da3c'
    );
    if (existing) {
      this.membresSig.update((list) =>
        list.map((m) =>
          m.userId === userId && m.communauteId === 'c-da3c' ? { ...m, actif: true } : m
        )
      );
    } else {
      this.membresSig.update((list) => [
        ...list,
        { userId, communauteId: 'c-da3c', roleLocal: 'membre', actif: true },
      ]);
    }
    if (!this.fichesSig().some((f) => f.userId === userId)) {
      const u = USERS.find((x) => x.id === userId);
      if (u) {
        this.fichesSig.update((list) => [
          ...list,
          {
            userId: u.id,
            nomAffiche: u.nom,
            mailSi: u.mail,
            site: u.site,
            perimetre: u.perimetre,
            entiteOperationnelle: u.entite,
            libellePoste: '',
            activitesPrincipales: '',
            sujetsAide: '',
            passions: '',
            canalMail: u.mail,
            canalTeams: u.mail,
            termeIds: [],
            updatedAt: new Date().toISOString(),
          },
        ]);
      }
    }
    this.showToast('Membre ajouté à DA3C');
  }

  removeMembre(userId: string): void {
    const pilotes = this.membresSig().filter(
      (m) => m.communauteId === 'c-da3c' && m.actif && m.roleLocal === 'pilote'
    );
    const target = this.membresSig().find(
      (m) => m.userId === userId && m.communauteId === 'c-da3c' && m.actif
    );
    if (target?.roleLocal === 'pilote' && pilotes.length <= 1) {
      this.showToast('Impossible : dernier pilote de la communauté');
      return;
    }
    this.membresSig.update((list) =>
      list.map((m) =>
        m.userId === userId && m.communauteId === 'c-da3c' ? { ...m, actif: false } : m
      )
    );
    this.purgeTermesHorsCommunautes(userId);
    this.showToast('Accès retiré');
  }

  setPilote(userId: string, isPilote: boolean): void {
    if (!isPilote) {
      const pilotes = this.membresSig().filter(
        (m) => m.communauteId === 'c-da3c' && m.actif && m.roleLocal === 'pilote'
      );
      const target = this.membresSig().find(
        (m) => m.userId === userId && m.communauteId === 'c-da3c' && m.actif
      );
      if (target?.roleLocal === 'pilote' && pilotes.length <= 1) {
        this.showToast('Impossible : dernier pilote');
        return;
      }
    }
    this.membresSig.update((list) => {
      const has = list.some((m) => m.userId === userId && m.communauteId === 'c-da3c');
      if (!has) {
        return [
          ...list,
          {
            userId,
            communauteId: 'c-da3c',
            roleLocal: isPilote ? 'pilote' : 'membre',
            actif: true,
          },
        ];
      }
      return list.map((m) =>
        m.userId === userId && m.communauteId === 'c-da3c'
          ? { ...m, roleLocal: isPilote ? 'pilote' : 'membre', actif: true }
          : m
      );
    });
    this.showToast(isPilote ? 'Pilote nommé (Wham hors maquette)' : 'Rôle pilote retiré');
  }

  stats() {
    const membres = this.membresSig().filter((m) => m.communauteId === 'c-da3c' && m.actif);
    const fiches = membres
      .map((m) => this.fichesSig().find((f) => f.userId === m.userId))
      .filter((f): f is Fiche => !!f);
    const completes = fiches.filter((f) => this.isFicheComplete(f)).length;
    return {
      membres: membres.length,
      fichesCompletes: completes,
      propositions: this.termesSig().filter((t) => t.statut === 'propose').length,
    };
  }

  sites(): string[] {
    return [...new Set(this.fichesSig().map((f) => f.site))].sort();
  }

  perimetres(): string[] {
    const fromFiches = this.fichesSig().map((f) => f.perimetre);
    return [...new Set([...PERIMETRES_TRAVAIL, ...fromFiches])].sort();
  }

  entites(): string[] {
    const fromFiches = this.fichesSig().flatMap((f) => f.entiteOperationnelle);
    return [...new Set([...ENTITES_OPERATIONNELLES, ...fromFiches])].sort();
  }

  libellesPoste(): string[] {
    const fromFiches = this.fichesSig().map((f) => f.libellePoste).filter(Boolean);
    return [...new Set([...LIBELLES_POSTE, ...fromFiches])].sort((a, b) =>
      a.localeCompare(b, 'fr')
    );
  }

  termeLabel(id: string): string {
    return this.termesSig().find((t) => t.id === id)?.libelle ?? id;
  }

  private purgeTermesHorsCommunautes(userId: string): void {
    const allowed = new Set(this.termesValidesForUser(userId).map((t) => t.id));
    this.fichesSig.update((list) =>
      list.map((f) =>
        f.userId === userId ? { ...f, termeIds: f.termeIds.filter((id) => allowed.has(id)) } : f
      )
    );
  }

  private refreshSiSnapshot(userId: string): void {
    const u = USERS.find((x) => x.id === userId);
    if (!u) return;
    this.fichesSig.update((list) =>
      list.map((f) => {
        if (f.userId !== userId) return f;
        return {
          ...f,
          nomAffiche: u.nom,
          mailSi: u.mail,
          site: u.site, // SI — non éditable sur la fiche
          // Périmètre & entités : champs fiche (éditables)
          canalMail: u.mail,
          canalTeams: u.mail,
        };
      })
    );
  }

  private readSession(): SessionState | null {
    try {
      const raw = localStorage.getItem('coesprit.session');
      return raw ? (JSON.parse(raw) as SessionState) : null;
    } catch {
      return null;
    }
  }

  private normalize(s: string): string {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
