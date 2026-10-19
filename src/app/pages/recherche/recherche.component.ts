import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonCol, IonGrid, IonRow } from '@ionic/angular/standalone';
import { Select } from 'primeng/select';
import { DemoStoreService } from '../../core/demo-store.service';
import { AIDE_DOMAINES } from '../../core/poc-aide-catalog';
import { toSelectOptions } from '../../core/referentiel-orga';
import { Fiche } from '../../core/models';

@Component({
  selector: 'app-recherche',
  standalone: true,
  imports: [FormsModule, RouterLink, Select, IonGrid, IonRow, IonCol],
  template: `
    @if (!store.myCommunautes().length && !store.isAdmin()) {
      <div class="empty">
        <div class="empty__icon">⌕</div>
        <h2>Recherche indisponible</h2>
        <p>Rejoins une communauté pour rechercher des profils.</p>
      </div>
    } @else {
      <div class="search-shell">
        <section class="search-bar">
          <div class="search-bar__main">
            <label class="field">
              <span class="field__label">Quel est ton besoin ?</span>
              <input
                class="input"
                [ngModel]="q()"
                (ngModelChange)="onQ($event)"
                placeholder="Ex. pilotage, risques, low-code, reporting…"
              />
            </label>
            <button type="button" class="btn btn--ghost" (click)="reset()">Réinitialiser</button>
          </div>

          <div class="search-bar__domaines">
            <span class="field__label">Par domaine</span>
            <div class="chip-row" role="group" aria-label="Filtrer par domaine">
              @for (d of domaines; track d.id) {
                <button
                  type="button"
                  [class]="'aide-chip aide-chip--' + d.tone + (domaineId() === d.id ? ' is-active' : '')"
                  (click)="toggleDomaine(d.id)"
                >
                  {{ d.label }}
                </button>
              }
            </div>
          </div>

          <ion-grid class="c8o-grid ion-no-padding search-bar__filters">
            <ion-row class="c8o-grid__row c8o-grid__row--gap-sm">
              <ion-col size="12" sizeMd="4">
                <label class="field">
                  <span class="field__label">Site</span>
                  <p-select
                    [options]="siteOptions()"
                    optionLabel="label"
                    optionValue="value"
                    [ngModel]="site()"
                    (ngModelChange)="site.set($event ?? '')"
                    placeholder="Tous les sites"
                    [showClear]="true"
                    appendTo="body"
                  />
                </label>
              </ion-col>
              <ion-col size="12" sizeMd="4">
                <label class="field">
                  <span class="field__label">Périmètre de travail</span>
                  <p-select
                    [options]="perimetreOptions()"
                    optionLabel="label"
                    optionValue="value"
                    [ngModel]="perimetre()"
                    (ngModelChange)="perimetre.set($event ?? '')"
                    placeholder="Tous les périmètres"
                    [showClear]="true"
                    appendTo="body"
                  />
                </label>
              </ion-col>
              <ion-col size="12" sizeMd="4">
                <label class="field">
                  <span class="field__label">Appétence</span>
                  <p-select
                    [options]="termeOptions()"
                    optionLabel="label"
                    optionValue="value"
                    [ngModel]="termeId()"
                    (ngModelChange)="termeId.set($event ?? '')"
                    placeholder="Toutes les appétences"
                    [showClear]="true"
                    appendTo="body"
                  />
                </label>
              </ion-col>
            </ion-row>
          </ion-grid>
        </section>

        <div class="search-meta">
          <div class="search-meta__count">
            <strong>{{ results().length }}</strong>
            profil{{ results().length > 1 ? 's' : '' }} trouvé{{ results().length > 1 ? 's' : '' }}
          </div>
          <span class="muted" style="font-size:13px">Clique une carte pour voir le profil et contacter</span>
        </div>

        <ion-grid class="c8o-grid ion-no-padding profile-grid">
          <ion-row class="c8o-grid__row">
            @for (f of results(); track f.userId) {
              <ion-col size="12" sizeMd="6" sizeLg="6" sizeXl="4">
                <a class="profile-card" [routerLink]="['/profil', f.userId]">
                  <div class="profile-card__head">
                    <div class="avatar" [class.avatar--photo]="!!f.photoUrl">
                      @if (f.photoUrl) {
                        <img [src]="f.photoUrl" alt="" />
                      } @else {
                        {{ initials(f.nomAffiche) }}
                      }
                    </div>
                    <div class="profile-card__identity">
                      <div class="profile-card__name">{{ f.nomAffiche }}</div>
                      @if (f.libellePoste) {
                        <div class="profile-card__poste">{{ f.libellePoste }}</div>
                      }
                      <div class="profile-card__meta">{{ f.site }} · {{ f.perimetre }}</div>
                    </div>
                  </div>

                  <div class="chip-row">
                    @for (d of domainesOf(f); track d.id) {
                      <span [class]="'aide-chip aide-chip--' + d.tone + ' aide-chip--static'">
                        {{ d.label }}
                      </span>
                    } @empty {
                      <span class="chip chip--muted">Pas d’appétence</span>
                    }
                  </div>

                  @if (appetencesPreview(f); as preview) {
                    @if (preview.length) {
                      <div class="profile-card__appetences">
                        @for (label of preview; track label) {
                          <span class="cv-tag cv-tag--soft">{{ label }}</span>
                        }
                        @if (appetencesRestantes(f) > 0) {
                          <span class="chip chip--muted">+{{ appetencesRestantes(f) }}</span>
                        }
                      </div>
                    }
                  }

                  <p class="profile-card__body">
                    {{ f.activitesPrincipales || 'Activités non renseignées pour le moment.' }}
                  </p>
                </a>
              </ion-col>
            } @empty {
              <ion-col size="12">
                <div class="empty">
                  <div class="empty__icon">∅</div>
                  <h2>Aucun profil pour ces critères</h2>
                  <p>Élargis les filtres ou reformule le besoin.</p>
                </div>
              </ion-col>
            }
          </ion-row>
        </ion-grid>
      </div>
    }
  `,
})
export class RechercheComponent {
  readonly store = inject(DemoStoreService);
  private readonly route = inject(ActivatedRoute);

  readonly domaines = AIDE_DOMAINES;
  readonly q = signal('');
  readonly site = signal('');
  readonly perimetre = signal('');
  readonly domaineId = signal('');
  readonly termeId = signal('');

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const terme = params.get('terme') ?? '';
      if (terme) this.termeId.set(terme);
      const domaine = params.get('domaine') ?? '';
      if (domaine) this.domaineId.set(domaine);
    });
  }

  readonly termes = computed(() => {
    const user = this.store.currentUser();
    return user ? this.store.termesFiltrablesForUser(user.id) : [];
  });

  /** Appétences du select, filtrées par domaine si un chip est actif */
  readonly termesFiltres = computed(() => {
    const domaine = this.domaineId();
    const list = this.termes();
    return domaine ? list.filter((t) => t.domaineId === domaine) : list;
  });

  readonly siteOptions = computed(() => toSelectOptions(this.store.sites()));
  readonly perimetreOptions = computed(() => toSelectOptions(this.store.perimetres()));
  readonly termeOptions = computed(() =>
    this.termesFiltres().map((t) => ({ label: t.libelle, value: t.id }))
  );

  readonly results = computed(() =>
    this.store.searchProfiles({
      q: this.q(),
      site: this.site(),
      perimetre: this.perimetre(),
      entite: '',
      domaineId: this.domaineId(),
      termeId: this.termeId(),
    })
  );

  onQ(value: string): void {
    this.q.set(value);
  }

  toggleDomaine(id: string): void {
    const next = this.domaineId() === id ? '' : id;
    this.domaineId.set(next);
    const terme = this.termeId();
    if (terme && next) {
      const t = this.termes().find((x) => x.id === terme);
      if (t && t.domaineId !== next) this.termeId.set('');
    }
  }

  reset(): void {
    this.q.set('');
    this.site.set('');
    this.perimetre.set('');
    this.domaineId.set('');
    this.termeId.set('');
  }

  domainesOf(f: Fiche) {
    return this.store.domainesPourFiche(f.termeIds);
  }

  appetencesPreview(f: Fiche): string[] {
    return this.store
      .termesSurFiche(f.termeIds)
      .slice(0, 3)
      .map((t) => t.libelle);
  }

  appetencesRestantes(f: Fiche): number {
    return Math.max(0, this.store.termesSurFiche(f.termeIds).length - 3);
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }
}
