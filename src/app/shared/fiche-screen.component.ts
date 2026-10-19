import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonCol, IonGrid, IonRow } from '@ionic/angular/standalone';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { DemoStoreService } from '../core/demo-store.service';
import { Fiche, ReferentielTerme } from '../core/models';
import { AIDE_DOMAINES, AideDomaine, domaineLabel } from '../core/poc-aide-catalog';
import {
  ENTITES_OPERATIONNELLES,
  LIBELLES_POSTE,
  PERIMETRES_TRAVAIL,
  toSelectOptions,
} from '../core/referentiel-orga';

@Component({
  selector: 'app-fiche-screen',
  standalone: true,
  imports: [FormsModule, Select, MultiSelect, IonGrid, IonRow, IonCol],
  template: `
    @if (draft(); as f) {
      <div class="cv" [class.cv--editing]="editing()">
        <section class="cv-maincard">
          <header class="cv-hero">
            <div class="cv-hero__row">
              <div class="cv-hero__identity">
                <div
                  class="cv-avatar"
                  [class.cv-avatar--photo]="!!f.photoUrl"
                  [class.cv-avatar--editable]="canEdit()"
                  [style.background]="f.photoUrl ? undefined : avatarColor(f.nomAffiche)"
                >
                  @if (f.photoUrl) {
                    <img class="cv-avatar__img" [src]="f.photoUrl" [alt]="'Photo de ' + f.nomAffiche" />
                  } @else {
                    <span>{{ initials(f.nomAffiche) }}</span>
                  }
                  @if (canEdit()) {
                    <label class="cv-avatar__edit" title="Changer la photo de profil">
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        (change)="onPhotoSelected($event)"
                      />
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M4 7h3l2-2h6l2 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linejoin="round"
                        />
                        <circle cx="12" cy="13" r="3.5" stroke="currentColor" stroke-width="2" />
                      </svg>
                      <span class="sr-only">Changer la photo de profil</span>
                    </label>
                  }
                </div>
                <div class="cv-hero__text">
                  <h1 class="cv-hero__name">{{ f.nomAffiche }}</h1>
                  <div class="cv-skills cv-skills--hero">
                    @for (d of selectedDomaines(); track d.id) {
                      <span [class]="'aide-chip aide-chip--' + d.tone + ' aide-chip--static'">
                        {{ d.label }}
                      </span>
                    } @empty {
                      <span class="cv-tag cv-tag--empty">Aucun domaine renseigné</span>
                    }
                  </div>
                </div>
              </div>

              <div class="cv-hero__aside">
                <div class="cv-cta cv-cta--hero">
                  @if (contactTeams(f)) {
                    <a class="cv-cta__btn cv-cta__btn--teams" [href]="teamsLink(contactTeams(f))" target="_blank" rel="noopener">
                      <img src="/img/teams.png" alt="" width="22" height="22" />
                      Teams
                    </a>
                  }
                  @if (contactMail(f)) {
                    <a class="cv-cta__btn cv-cta__btn--mail" [href]="'mailto:' + contactMail(f)">
                      <img src="/img/outlook.png" alt="" width="22" height="22" />
                      Envoyer un e-mail
                    </a>
                  }
                </div>
              </div>
            </div>
          </header>
        </section>

        <ion-grid class="c8o-grid ion-no-padding">
          <ion-row class="c8o-grid__row">
            <ion-col size="12" sizeMd="8" class="cv-main">
            <section class="cv-card aide-form">
              <h2 class="cv-card__title">Je peux t’aider sur…</h2>

              @if (editing()) {
                <div class="search aide-form__search">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
                    <path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <input
                    class="input"
                    type="search"
                    placeholder="Rechercher une appétence…"
                    [ngModel]="query()"
                    (ngModelChange)="query.set($event)"
                  />
                </div>

                <div class="aide-form__domaines">
                  <span class="field__label">Par domaine</span>
                  <div class="chip-row" role="group" aria-label="Filtrer par domaine">
                    @for (d of domaines; track d.id) {
                      <button
                        type="button"
                        class="aide-chip"
                        [class]="'aide-chip aide-chip--' + d.tone + (domaineFilter() === d.id ? ' is-active' : '')"
                        (click)="toggleDomaine(d.id)"
                      >
                        {{ d.label }}
                      </button>
                    }
                  </div>
                </div>

                <div class="aide-form__list" role="group" aria-label="Appétences du référentiel">
                  @for (t of filteredTermes(); track t.id) {
                    <label class="aide-item" [class.is-on]="isSelected(t.id)">
                      <input
                        type="checkbox"
                        [checked]="isSelected(t.id)"
                        (change)="toggleTerme(t.id)"
                      />
                      <span class="aide-item__box" aria-hidden="true"></span>
                      <span class="aide-item__icon" aria-hidden="true">
                        @switch (t.icon || 'star') {
                          @case ('shield') {
                            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z"/></svg>
                          }
                          @case ('people') {
                            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm-8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.7 0-8 1.3-8 4v2h10v-2c0-1.5.7-2.7 1.8-3.5A12.5 12.5 0 0 0 8 13zm8 0c-.4 0-.8 0-1.2.1 1.3.9 2.2 2.2 2.2 3.9v2h7v-2c0-2.7-5.3-4-8-4z"/></svg>
                          }
                          @case ('chat') {
                            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
                          }
                          @case ('doc') {
                            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm8 1.5V8h4.5L14 3.5z"/></svg>
                          }
                          @case ('brain') {
                            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M9 3a4 4 0 0 0-3.9 3.2A3.5 3.5 0 0 0 4 12.8V14a4 4 0 0 0 3 3.9V21h2v-3h2v3h2v-3.1A4 4 0 0 0 16 14v-1.2A3.5 3.5 0 0 0 18.9 6.2 4 4 0 0 0 11.2 3.3 4 4 0 0 0 9 3z"/></svg>
                          }
                          @case ('loop') {
                            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 4a8 8 0 1 1-7.5 5.1l1.8.7A6 6 0 1 0 12 6V3l4 3-4 3V7z"/></svg>
                          }
                          @case ('flow') {
                            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M7 3h4v4H7V3zm6 0h4v4h-4V3zM4 10h6v4H4v-4zm10 0h6v4h-6v-4zM7 17h4v4H7v-4zm6 0h4v4h-4v-4z"/></svg>
                          }
                          @case ('chart') {
                            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 3h2v18H3V3zm4 10h2v8H7v-8zm4-6h2v14h-2V7zm4 4h2v10h-2V11zm4-8h2v18h-2V3z"/></svg>
                          }
                          @case ('laptop') {
                            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M4 5h16a2 2 0 0 1 2 2v8H2V7a2 2 0 0 1 2-2zm-2 12h20v2H2v-2z"/></svg>
                          }
                          @case ('change') {
                            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M7 7h7V4l5 4-5 4V9H7a3 3 0 0 0 0 6h2v2H7a5 5 0 0 1 0-10zm10 4h-2v2h2a3 3 0 0 1 0 6h-7v-3l-5 4 5 4v-3h7a5 5 0 0 0 0-10z"/></svg>
                          }
                          @case ('hands') {
                            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm-7.5 1A2.5 2.5 0 0 0 2 14.5V19h3v-4.2A4.4 4.4 0 0 1 8.2 13 6.8 6.8 0 0 1 12 12a6.8 6.8 0 0 1 3.8-.8A4.4 4.4 0 0 1 19 14.8V19h3v-4.5a2.5 2.5 0 0 0-2.5-2.5 2.5 2.5 0 0 0-1.8.6A6.8 6.8 0 0 1 12 12a6.8 6.8 0 0 1-5.7.6 2.5 2.5 0 0 0-1.8-.6z"/></svg>
                          }
                          @default {
                            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 2l2.4 6.8H21l-5.4 4 2.1 6.7L12 15.8 6.3 19.5 8.4 12.8 3 8.8h6.6L12 2z"/></svg>
                          }
                        }
                      </span>
                      <span class="aide-item__label">{{ t.libelle }}</span>
                    </label>
                  }

                  <!-- Autre : présent dans chaque domaine — ouvre la proposition -->
                  <button
                    type="button"
                    class="aide-item aide-item--autre"
                    [class.is-on]="proposeOpen()"
                    (click)="ouvrirProposition()"
                  >
                    <span class="aide-item__box aide-item__box--plus" aria-hidden="true"></span>

                    <span class="aide-item__label">Autre</span>
                  </button>
                </div>

                @if (proposeOpen()) {
                  <div class="aide-propose">
                    @if (proposeDomaineLabel()) {
                      <p class="aide-propose__domaine">
                        Domaine prérempli : <strong>{{ proposeDomaineLabel() }}</strong>
                      </p>
                    } @else {
                      <label class="field">
                        <span class="field__label">Domaine <span class="req">*</span></span>
                        <p-select
                          [options]="domaineOptions"
                          optionLabel="label"
                          optionValue="value"
                          [ngModel]="proposeDomaine()"
                          (ngModelChange)="proposeDomaine.set($event ?? '')"
                          placeholder="Choisir un domaine…"
                          [showClear]="true"
                          appendTo="body"
                        />
                      </label>
                    }
                    <div class="cv-add-skill">
                      <input
                        class="input"
                        placeholder="Libellé de la nouvelle appétence…"
                        [ngModel]="nouveauTerme()"
                        (ngModelChange)="nouveauTerme.set($event)"
                        (keydown.enter)="proposer(); $event.preventDefault()"
                      />
                      <button type="button" class="cv-add-skill__btn" (click)="proposer()" aria-label="Proposer">+</button>
                    </div>
                    <p class="cv-hint">L’appétence est ajoutée à ta fiche.</p>
                  </div>
                }
              } @else {
                @if (groupesConsultation().length) {
                  <div class="aide-groupes">
                    @for (g of groupesConsultation(); track g.domaine.id) {
                      <div class="aide-groupe">
                        <span [class]="'aide-chip aide-chip--' + g.domaine.tone + ' aide-chip--static'">
                          {{ g.domaine.label }}
                        </span>
                        <div class="cv-skills">
                          @for (t of g.termes; track t.id) {
                            <span class="cv-tag cv-tag--soft">{{ t.libelle }}</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <span class="cv-tag cv-tag--empty">Pas encore d’appétences renseignées</span>
                }
                @if (canEdit()) {
                  <p class="cv-hint">Clique « Modifier ma fiche » pour cocher ou ajouter une appétence.</p>
                }
              }
            </section>
            </ion-col>

            <ion-col size="12" sizeMd="4" class="cv-side">
            <section class="cv-card cv-card--soft">
              <h2 class="cv-card__title">Organisation</h2>
              @if (editing()) {
                <div class="cv-fields">
                  <label class="field">
                    <span class="field__label">Site</span>
                    <input class="input" [value]="f.site" readonly />
                  </label>
                  <label class="field">
                    <span class="field__label">Périmètre de travail <span class="req">*</span></span>
                    <p-select
                      [options]="perimetreOptions()"
                      optionLabel="label"
                      optionValue="value"
                      [ngModel]="f.perimetre"
                      (ngModelChange)="patch({ perimetre: $event })"
                      placeholder="Choisir un périmètre…"
                      appendTo="body"
                    />
                  </label>
                  <label class="field">
                    <span class="field__label">Entité opérationnelle <span class="req">*</span></span>
                    <p-multiSelect
                      [options]="entiteOptions()"
                      optionLabel="label"
                      optionValue="value"
                      [ngModel]="f.entiteOperationnelle"
                      (ngModelChange)="patch({ entiteOperationnelle: $event ?? [] })"
                      placeholder="Choisir une ou plusieurs entités…"
                      display="chip"
                      [filter]="false"
                      appendTo="body"
                    />
                  </label>
                </div>
              } @else {
                <dl class="cv-info">
                  <div><dt>Site</dt><dd>{{ f.site }}</dd></div>
                  <div><dt>Périmètre de travail</dt><dd>{{ f.perimetre || '—' }}</dd></div>
                  <div><dt>Entité opérationnelle</dt><dd>{{ entitesLabel(f) || '—' }}</dd></div>
                </dl>
              }
            </section>

            <section class="cv-card">
              <h2 class="cv-card__title">Ce que je fais au quotidien</h2>
              @if (editing()) {
                <div class="cv-fields">
                  <label class="field">
                    <span class="field__label">Libellé du poste <span class="req">*</span></span>
                    <p-select
                      [options]="posteOptions()"
                      optionLabel="label"
                      optionValue="value"
                      [ngModel]="f.libellePoste"
                      (ngModelChange)="patch({ libellePoste: $event ?? '' })"
                      placeholder="Choisir ou saisir un libellé…"
                      [editable]="true"
                      [filter]="true"
                      appendTo="body"
                    />
                  </label>
                  <label class="field">
                    <span class="field__label">Description <span class="req">*</span></span>
                    <textarea
                      class="textarea"
                      rows="4"
                      [ngModel]="f.activitesPrincipales"
                      (ngModelChange)="patch({ activitesPrincipales: $event })"
                      placeholder="Décris ce que tu fais au quotidien…"
                    ></textarea>
                  </label>
                </div>
              } @else {
                <div class="cv-quotidien">
                  <p class="cv-quotidien__poste" [class.is-empty]="!f.libellePoste">
                    {{ f.libellePoste || 'Poste non renseigné' }}
                  </p>
                  <p class="cv-story__text" [class.is-empty]="!f.activitesPrincipales">
                    {{ f.activitesPrincipales || 'Pas encore renseigné.' }}
                  </p>
                </div>
              }
            </section>
            </ion-col>
          </ion-row>
        </ion-grid>

        <div class="cv-fiche-foot">
          <p class="cv-updated cv-updated--fiche" role="status">
            Dernière mise à jour de la fiche :
            <time [attr.datetime]="f.updatedAt">{{ formatUpdatedAt(f.updatedAt) }}</time>
          </p>
          <div class="cv-fiche-foot__actions">
            @if (canEdit() && !editing()) {
              <button type="button" class="btn" (click)="startEdit()">Modifier ma fiche</button>
            }
            @if (editing()) {
              <button type="button" class="btn btn--ghost" (click)="cancelEdit()">Annuler</button>
              <button type="button" class="btn" (click)="saveNow()">Enregistrer</button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class FicheScreenComponent {
  readonly store = inject(DemoStoreService);

  readonly editable = input(false);
  readonly fiche = input.required<Fiche>();
  readonly saved = output<void>();

  readonly domaines = AIDE_DOMAINES;
  readonly domaineOptions = AIDE_DOMAINES.map((d) => ({ label: d.label, value: d.id }));
  readonly draft = signal<Fiche | null>(null);
  readonly editing = signal(false);
  readonly query = signal('');
  readonly domaineFilter = signal<string | null>(null);
  readonly nouveauTerme = signal('');
  /** Formulaire de proposition ouvert via « Autre » */
  readonly proposeOpen = signal(false);
  /** Domaine rattaché à la proposition (prérempli si filtre domaine actif) */
  readonly proposeDomaine = signal('');

  private snapshot: Fiche | null = null;

  constructor() {
    effect(() => {
      const src = structuredClone(this.fiche());
      // Ne pas écraser le brouillon pendant l’édition (sinon Site / selects reviennent en arrière)
      if (untracked(() => this.editing())) return;
      this.draft.set(src);
      this.snapshot = structuredClone(src);
    });
  }

  readonly canEdit = computed(() => this.editable());

  readonly perimetreOptions = computed(() => {
    const cur = this.draft()?.perimetre;
    const list =
      cur && !PERIMETRES_TRAVAIL.includes(cur) ? [cur, ...PERIMETRES_TRAVAIL] : PERIMETRES_TRAVAIL;
    return toSelectOptions(list);
  });

  readonly entiteOptions = computed(() => {
    const cur = this.draft()?.entiteOperationnelle ?? [];
    const extra = cur.filter((e) => !ENTITES_OPERATIONNELLES.includes(e));
    return toSelectOptions([...extra, ...ENTITES_OPERATIONNELLES]);
  });

  readonly posteOptions = computed(() => {
    const cur = this.draft()?.libellePoste?.trim();
    const base = this.store.libellesPoste();
    const list = cur && !base.includes(cur) ? [cur, ...base] : base.length ? base : LIBELLES_POSTE;
    return toSelectOptions(list);
  });

  /** Validées + mes propositions déjà sur la fiche */
  readonly termesSelectionnables = computed(() => {
    const f = this.draft();
    return f ? this.store.termesSelectionnablesPourFiche(f.userId, f.termeIds) : [];
  });

  readonly selectedTermes = computed(() => {
    const ids = this.draft()?.termeIds ?? [];
    return this.store.termesSurFiche(ids);
  });

  /** Domaines concernés par les appétences cochées (ordre catalogue) */
  readonly selectedDomaines = computed((): AideDomaine[] => {
    const ids = new Set(
      this.selectedTermes()
        .map((t) => t.domaineId)
        .filter((id): id is string => !!id)
    );
    return AIDE_DOMAINES.filter((d) => ids.has(d.id));
  });

  /** Consultation : domaine → appétences liées */
  readonly groupesConsultation = computed(() =>
    AIDE_DOMAINES.map((domaine) => ({
      domaine,
      termes: this.selectedTermes().filter((t) => t.domaineId === domaine.id),
    })).filter((g) => g.termes.length > 0)
  );

  readonly filteredTermes = computed((): ReferentielTerme[] => {
    const q = this.query().trim().toLowerCase();
    const domaine = this.domaineFilter();
    return this.termesSelectionnables().filter((t) => {
      if (domaine && t.domaineId !== domaine) return false;
      if (q && !t.libelle.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  readonly proposeDomaineLabel = computed(() => {
    const id = this.proposeDomaine();
    return id ? domaineLabel(id) : '';
  });

  startEdit(): void {
    const f = this.draft();
    if (!f) return;
    this.snapshot = structuredClone(f);
    this.editing.set(true);
  }

  cancelEdit(): void {
    if (this.snapshot) {
      this.draft.set(structuredClone(this.snapshot));
    }
    this.editing.set(false);
    this.query.set('');
    this.domaineFilter.set(null);
    this.resetProposition();
  }

  saveNow(): void {
    this.persist();
    this.editing.set(false);
  }

  patch(partial: Partial<Fiche>): void {
    const f = this.draft();
    if (!f || !this.editing()) return;
    this.draft.set({ ...f, ...partial });
  }

  toggleDomaine(id: string): void {
    this.domaineFilter.update((cur) => (cur === id ? null : id));
    // Si le formulaire Autre est ouvert, suit le domaine filtré
    if (this.proposeOpen()) {
      const next = this.domaineFilter();
      this.proposeDomaine.set(next ?? '');
    }
  }

  isSelected(id: string): boolean {
    return (this.draft()?.termeIds ?? []).includes(id);
  }

  toggleTerme(id: string): void {
    const f = this.draft();
    if (!f || !this.editing()) return;
    const has = f.termeIds.includes(id);
    this.draft.set({
      ...f,
      termeIds: has ? f.termeIds.filter((x) => x !== id) : [...f.termeIds, id],
    });
  }

  ouvrirProposition(): void {
    if (this.proposeOpen()) {
      this.resetProposition();
      return;
    }
    const domaine = this.domaineFilter();
    this.proposeOpen.set(true);
    this.proposeDomaine.set(domaine ?? '');
  }

  proposer(): void {
    if (!this.editing() || !this.proposeOpen()) return;
    const f = this.draft();
    const label = this.nouveauTerme().trim();
    const domaine = this.proposeDomaine().trim();
    if (!f || !label) return;
    if (!domaine) {
      this.store.showToast('Choisis un domaine pour ta proposition');
      return;
    }
    const id = this.store.proposeTerme(label, domaine);
    if (!id) return;
    // Ajout immédiat sur le brouillon (enregistré au clic Enregistrer)
    if (!f.termeIds.includes(id)) {
      this.draft.set({ ...f, termeIds: [...f.termeIds, id] });
    }
    this.resetProposition();
  }

  private resetProposition(): void {
    this.nouveauTerme.set('');
    this.proposeOpen.set(false);
    this.proposeDomaine.set('');
  }

  onPhotoSelected(event: Event): void {
    if (!this.canEdit()) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.store.showToast('Choisis une image (JPG, PNG…)');
      input.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.store.showToast('Image trop lourde (max 2 Mo)');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const photoUrl = String(reader.result ?? '');
      if (!photoUrl) return;
      const f = this.draft();
      if (!f) return;
      const next = { ...f, photoUrl };
      this.draft.set(next);
      if (this.snapshot) this.snapshot = { ...this.snapshot, photoUrl };
      this.store.saveFiche({ photoUrl }, { silent: true });
      this.store.showToast('Photo de profil mise à jour');
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  entitesLabel(f: Fiche): string {
    return f.entiteOperationnelle?.length ? f.entiteOperationnelle.join(', ') : '—';
  }

  formatUpdatedAt(iso: string | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  contactMail(f: Fiche): string {
    return (f.mailSi || f.canalMail || '').trim();
  }

  contactTeams(f: Fiche): string {
    return (f.canalTeams || f.mailSi || f.canalMail || '').trim();
  }

  teamsLink(upn: string): string {
    return `https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(upn)}`;
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  avatarColor(name: string): string {
    const hues = [210, 195, 170, 330, 145];
    let h = 0;
    for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
    return `hsl(${hues[h % hues.length]} 55% 42%)`;
  }

  private persist(): void {
    const f = this.draft();
    if (!f || !this.editable()) return;
    this.store.saveFiche(f);
    this.snapshot = structuredClone(this.store.myFiche()!);
    this.draft.set(structuredClone(this.snapshot));
    this.saved.emit();
  }
}
