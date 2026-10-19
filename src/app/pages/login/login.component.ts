import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonCol, IonGrid, IonRow } from '@ionic/angular/standalone';
import { Select } from 'primeng/select';
import { DemoStoreService } from '../../core/demo-store.service';
import { DemoRole, DemoUser } from '../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, Select, IonGrid, IonRow, IonCol],
  template: `
    <div class="login-page">
      <ion-grid class="c8o-grid ion-no-padding login-page__grid">
        <ion-row class="c8o-grid__row">
          <ion-col size="12" sizeMd="8" sizeLg="5" sizeXl="4">
            <div class="login-card">
              <div class="login-card__brand">CO'Esprit</div>
              <p class="login-card__tagline">
                Maquette navigable — UX Urssaf (LCNC). SSO simulé : choisis un profil démo.
              </p>

              <label class="field">
                <span class="field__label">Personne</span>
                <p-select
                  [options]="userOptions()"
                  optionLabel="label"
                  optionValue="value"
                  [ngModel]="userId()"
                  (ngModelChange)="onUserId($event)"
                  placeholder="Choisir une personne…"
                  appendTo="body"
                />
              </label>

              <div class="login-roles">
                @for (r of roles; track r.id) {
                  <button
                    type="button"
                    class="login-role"
                    [class.is-selected]="role() === r.id"
                    (click)="role.set(r.id)"
                  >
                    <div>
                      <div class="login-role__name">{{ r.label }}</div>
                      <div class="login-role__meta">{{ r.hint }}</div>
                    </div>
                  </button>
                }
              </div>

              <button type="button" class="btn btn--primary" style="width:100%" (click)="connect()">
                Se connecter (SSO démo)
              </button>
            </div>
          </ion-col>
        </ion-row>
      </ion-grid>
    </div>
  `,
})
export class LoginComponent {
  readonly store = inject(DemoStoreService);
  private readonly router = inject(Router);

  readonly userId = signal(this.store.users[0].id);
  readonly role = signal<DemoRole>('membre');

  readonly userOptions = computed(() =>
    this.store.users.map((u) => ({
      label: `${u.nom} — ${u.site}`,
      value: u.id,
    }))
  );

  readonly roles: Array<{ id: DemoRole; label: string; hint: string }> = [
    { id: 'membre', label: 'Membre', hint: 'Fiche + recherche + contact' },
    { id: 'pilote', label: 'Pilote', hint: 'Membres + référentiel (si rattachement pilote)' },
    { id: 'admin', label: 'Admin appli', hint: 'Communautés + nomination pilotes' },
  ];

  onUserId(id: string): void {
    if (!id) return;
    this.userId.set(id);
    const u = this.store.users.find((x: DemoUser) => x.id === id);
    if (u) this.role.set(u.roleWham);
  }

  connect(): void {
    this.store.login(this.userId(), this.role());
    void this.router.navigateByUrl('/recherche');
  }
}
