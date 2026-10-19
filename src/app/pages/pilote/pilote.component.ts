import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonCol, IonGrid, IonRow } from '@ionic/angular/standalone';
import { Select } from 'primeng/select';
import { AIDE_DOMAINES, domaineLabel } from '../../core/poc-aide-catalog';
import { DemoStoreService } from '../../core/demo-store.service';

@Component({
  selector: 'app-pilote',
  standalone: true,
  imports: [FormsModule, Select, IonGrid, IonRow, IonCol],
  template: `
    @if (!store.isPilote() && !store.isAdmin()) {
      <div class="empty">
        Espace réservé aux pilotes (Wham + rôle local). Connecte-toi en pilote avec Aude Abril pour la démo.
      </div>
    } @else {
      <ion-grid class="c8o-grid ion-no-padding">
        <ion-row class="c8o-grid__row">
          <ion-col size="12">
            <div class="panel">
              <h2 class="panel__title">Membres DA3C</h2>

              <div class="inline-actions" style="margin-bottom:16px">
                <div class="pilote-select">
                  <p-select
                    [options]="candidatOptions()"
                    optionLabel="label"
                    optionValue="value"
                    [(ngModel)]="candidatId"
                    placeholder="Ajouter depuis l’annuaire SI…"
                    [showClear]="true"
                    appendTo="body"
                  />
                </div>
                <button type="button" class="btn btn--primary" [disabled]="!candidatId" (click)="ajouter()">
                  Ajouter
                </button>
              </div>

              <table class="table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Rôle</th>
                    <th>Actif</th>
                    <th>Fiche</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of store.membresDa3c(); track m.userId) {
                    <tr>
                      <td>{{ m.user.nom }}</td>
                      <td>{{ m.roleLocal }}</td>
                      <td>
                        <span class="badge" [class.badge--ok]="m.actif" [class.badge--warn]="!m.actif">
                          {{ m.actif ? 'Oui' : 'Non' }}
                        </span>
                      </td>
                      <td>
                        @if (m.fiche) {
                          <span class="badge" [class.badge--ok]="store.isFicheComplete(m.fiche)" [class.badge--warn]="!store.isFicheComplete(m.fiche)">
                            {{ store.isFicheComplete(m.fiche) ? 'Complète' : 'Incomplète' }}
                          </span>
                        }
                      </td>
                      <td>
                        @if (m.actif) {
                          <button type="button" class="btn btn--danger btn--sm" (click)="retirer(m.userId)">
                            Retirer l’accès
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </ion-col>
        </ion-row>
        <ion-row class="c8o-grid__row">
          <ion-col size="12">
            <div class="panel">
              <h2 class="panel__title">Référentiel d’appétences</h2>
              <p class="muted" style="margin:0 0 14px;font-size:13px">
                Les membres ajoutent une appétence via « Autre » : elle apparaît tout de suite sur leur fiche.
                Tu valides pour la rendre disponible aux autres fiches (et tu confirmes le domaine).
              </p>
              <table class="table">
                <thead>
                  <tr>
                    <th>Libellé</th>
                    <th>Domaine</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (t of store.termesProposables(); track t.id) {
                    <tr>
                      <td>{{ t.libelle }}</td>
                      <td>
                        @if (t.statut === 'propose') {
                          <div class="pilote-select pilote-select--sm">
                            <p-select
                              class="select--sm"
                              [options]="domaineOptions"
                              optionLabel="label"
                              optionValue="value"
                              [ngModel]="domainePour(t.id, t.domaineId)"
                              (ngModelChange)="domaineDraft[t.id] = $event ?? ''"
                              placeholder="Choisir…"
                              [showClear]="true"
                              appendTo="body"
                            />
                          </div>
                        } @else if (t.statut === 'valide') {
                          <div class="pilote-select pilote-select--sm">
                            <p-select
                              class="select--sm"
                              [options]="domaineOptions"
                              optionLabel="label"
                              optionValue="value"
                              [ngModel]="t.domaineId || ''"
                              (ngModelChange)="store.setTermeDomaine(t.id, $event ?? '')"
                              appendTo="body"
                            />
                          </div>
                        } @else {
                          <span class="muted">{{ labelDomaine(t.domaineId) }}</span>
                        }
                      </td>
                      <td>
                        <span
                          class="chip"
                          [class.chip--warning]="t.statut === 'propose'"
                          [class.chip--success]="t.statut === 'valide'"
                          [class.chip--muted]="t.statut === 'archive' || t.statut === 'refuse'"
                        >
                          {{ t.statut }}
                        </span>
                      </td>
                      <td class="inline-actions">
                        @if (t.statut === 'propose') {
                          <button
                            type="button"
                            class="btn btn--primary btn--sm"
                            [disabled]="!domainePour(t.id, t.domaineId)"
                            (click)="valider(t.id, t.domaineId)"
                          >
                            Valider
                          </button>
                          <button type="button" class="btn btn--sm" (click)="store.setTermeStatut(t.id, 'refuse')">
                            Refuser
                          </button>
                        }
                        @if (t.statut === 'valide') {
                          <button type="button" class="btn btn--sm" (click)="store.setTermeStatut(t.id, 'archive')">
                            Archiver
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </ion-col>
        </ion-row>
      </ion-grid>
    }
  `,
})
export class PiloteComponent {
  readonly store = inject(DemoStoreService);
  readonly domaines = AIDE_DOMAINES;
  readonly domaineOptions = AIDE_DOMAINES.map((d) => ({ label: d.label, value: d.id }));
  readonly labelDomaine = domaineLabel;
  candidatId = '';
  domaineDraft: Record<string, string> = {};

  readonly candidatOptions = computed(() =>
    this.store.candidatsHorsCommunaute().map((u) => ({
      label: `${u.nom} — ${u.mail}`,
      value: u.id,
    }))
  );

  ajouter(): void {
    if (!this.candidatId) return;
    this.store.addMembre(this.candidatId);
    this.candidatId = '';
  }

  retirer(userId: string): void {
    if (confirm('Retirer l’accès de cette personne à DA3C ?')) {
      this.store.removeMembre(userId);
    }
  }

  /** Domaine saisi ou déjà proposé par le membre (via Autre) */
  domainePour(id: string, proposeDomaine: string | null): string {
    return this.domaineDraft[id] ?? proposeDomaine ?? '';
  }

  valider(id: string, proposeDomaine: string | null): void {
    const domaineId = this.domainePour(id, proposeDomaine);
    if (!domaineId) return;
    this.store.validerTerme(id, domaineId);
    delete this.domaineDraft[id];
  }
}
