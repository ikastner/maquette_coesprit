import { Component, inject } from '@angular/core';
import { IonCol, IonGrid, IonRow } from '@ionic/angular/standalone';
import { DemoStoreService } from '../../core/demo-store.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [IonGrid, IonRow, IonCol],
  template: `
    @if (!store.isAdmin()) {
      <div class="empty">Réservé à l’admin appli. Connecte-toi avec Vincent Bayle en rôle Admin.</div>
    } @else {
      <ion-grid class="c8o-grid ion-no-padding">
        <ion-row class="c8o-grid__row">
          <ion-col size="12">
            <div class="panel">
              <h2 class="panel__title">Communautés</h2>
              <table class="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Libellé</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>DA3C</td>
                    <td>Communauté DA3C — Chefs de projet</td>
                    <td><span class="badge badge--ok">active</span></td>
                  </tr>
                  <tr>
                    <td>DEMO2</td>
                    <td>Communauté démo (V1.1+)</td>
                    <td><span class="badge badge--warn">inactive</span></td>
                  </tr>
                </tbody>
              </table>
              <p class="muted" style="margin-top:12px">
                Création de nouvelles communautés : prévue côté Convertigo (hors maquette interactive).
              </p>
            </div>
          </ion-col>
        </ion-row>
        <ion-row class="c8o-grid__row">
          <ion-col size="12">
            <div class="panel">
              <h2 class="panel__title">Nomination des pilotes DA3C</h2>
              <p class="muted" style="margin-bottom:16px">
                Écriture en base uniquement — provisioning Wham hors appli (simulé ici).
              </p>
              <table class="table">
                <thead>
                  <tr>
                    <th>Membre</th>
                    <th>Rôle local</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of store.membresDa3c(); track m.userId) {
                    @if (m.actif) {
                      <tr>
                        <td>{{ m.user.nom }}</td>
                        <td>{{ m.roleLocal }}</td>
                        <td>
                          @if (m.roleLocal !== 'pilote') {
                            <button type="button" class="btn btn--primary btn--sm" (click)="store.setPilote(m.userId, true)">
                              Nommer pilote
                            </button>
                          } @else {
                            <button type="button" class="btn btn--sm" (click)="store.setPilote(m.userId, false)">
                              Retirer pilote
                            </button>
                          }
                        </td>
                      </tr>
                    }
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
export class AdminComponent {
  readonly store = inject(DemoStoreService);
}
