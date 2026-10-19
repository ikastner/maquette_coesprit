import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { DemoStoreService } from '../../core/demo-store.service';
import { FicheScreenComponent } from '../../shared/fiche-screen.component';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [FicheScreenComponent, RouterLink],
  template: `
    @if (!canView()) {
      <div class="empty">
        <div class="empty__icon">⊘</div>
        <h2>Profil inaccessible</h2>
        <p>Ce profil est hors de tes communautés.</p>
        <div style="margin-top:16px">
          <a routerLink="/recherche" class="btn btn--primary">Retour à la recherche</a>
        </div>
      </div>
    } @else {
      @if (fiche(); as f) {
        <app-fiche-screen [fiche]="f" [editable]="isMine()" />
      } @else {
        <div class="empty">
          <div class="empty__icon">?</div>
          <h2>Profil introuvable</h2>
          <p>Cette fiche n’existe pas ou plus.</p>
        </div>
      }
    }
  `,
})
export class ProfilComponent {
  readonly store = inject(DemoStoreService);
  private readonly route = inject(ActivatedRoute);

  private readonly userId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('userId') ?? '')),
    { initialValue: '' }
  );

  readonly fiche = computed(() => {
    const id = this.userId();
    return id ? this.store.getFiche(id) : null;
  });

  readonly canView = computed(() => {
    const id = this.userId();
    return !!id && this.store.canViewFiche(id);
  });

  readonly isMine = computed(() => this.userId() === this.store.session()?.userId);
}
