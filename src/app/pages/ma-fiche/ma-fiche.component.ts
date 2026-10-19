import { Component, computed, inject } from '@angular/core';
import { DemoStoreService } from '../../core/demo-store.service';
import { FicheScreenComponent } from '../../shared/fiche-screen.component';

@Component({
  selector: 'app-ma-fiche',
  standalone: true,
  imports: [FicheScreenComponent],
  template: `
    @if (fiche(); as f) {
      <app-fiche-screen [fiche]="f" [editable]="true" />
    } @else {
      <div class="empty">
        <div class="empty__icon">✎</div>
        <h2>Aucune fiche</h2>
        <p>Connecte-toi avec un membre DA3C pour éditer ton profil.</p>
      </div>
    }
  `,
})
export class MaFicheComponent {
  readonly store = inject(DemoStoreService);
  readonly fiche = computed(() => this.store.myFiche());
}
