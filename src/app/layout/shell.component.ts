import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { DemoStoreService } from '../core/demo-store.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app" [class.is-collapsed]="collapsed()">
      <aside class="sidebar">
        <div class="sidebar__brand">
          <div class="sidebar__app">
            CO'Esprit
            <small>Mieux s'entraider</small>
          </div>
          <button type="button" class="sidebar__icon-btn sidebar__collapse" (click)="collapsed.set(!collapsed())" aria-label="Réduire le menu">
            ☰
          </button>
        </div>

        <nav class="sidebar__nav">
          <div class="sidebar__section">Communauté</div>
          <a routerLink="/recherche" routerLinkActive="is-active" class="nav-btn">
            <span class="nav-btn__label">Recherche</span>
          </a>
          <a routerLink="/ma-fiche" routerLinkActive="is-active" class="nav-btn">
            <span class="nav-btn__label">Ma fiche</span>
          </a>

          @if (store.isPilote() || store.isAdmin()) {
            <div class="sidebar__section">Pilotage</div>
            <a routerLink="/pilote" routerLinkActive="is-active" class="nav-btn">
              <span class="nav-btn__label">Espace pilote</span>
              @if (store.stats().propositions; as n) {
                @if (n > 0) {
                  <span class="nav-btn__badge">{{ n }}</span>
                }
              }
            </a>
          }

          @if (store.isAdmin()) {
            <div class="sidebar__section">Administration</div>
            <a routerLink="/admin" routerLinkActive="is-active" class="nav-btn">
              <span class="nav-btn__label">Admin</span>
            </a>
          }
        </nav>

        <div class="sidebar__user">
          <div class="sidebar__user-text">
            <div class="sidebar__user-name">{{ store.currentUser()?.nom }}</div>
            <div class="sidebar__user-role">{{ roleLabel() }}</div>
          </div>
          <button type="button" class="sidebar__icon-btn" (click)="logout()" aria-label="Déconnexion">⎋</button>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <div>
            <div class="topbar__crumbs">CO'Esprit · DA3C</div>
            <h1 class="topbar__title">{{ title() }}</h1>
            @if (subtitle()) {
              <p class="topbar__subtitle">{{ subtitle() }}</p>
            }
          </div>
          <div class="topbar__actions">
            @if (showBackRecherche()) {
              <a routerLink="/recherche" class="topbar__back">
                <span class="topbar__back-arrow" aria-hidden="true">←</span>
                Retour à la recherche
              </a>
            }
          </div>
        </header>
        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>

    @if (store.toast(); as msg) {
      <div class="toasts" role="status">
        <div class="toast toast--success"><span>{{ msg }}</span></div>
      </div>
    }
  `,
})
export class ShellComponent {
  readonly store = inject(DemoStoreService);
  private readonly router = inject(Router);

  readonly collapsed = signal(false);
  readonly title = signal('Recherche');
  readonly subtitle = signal('Décrire un besoin → filtrer → identifier → contacter');
  readonly showBackRecherche = signal(false);

  readonly roleLabel = computed(() => {
    const role = this.store.session()?.role;
    if (role === 'admin') return 'Admin appli';
    if (role === 'pilote' || this.store.isPilote()) return 'Pilote DA3C';
    return 'Membre';
  });

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((e) => this.applyTitle(e.urlAfterRedirects));
    this.applyTitle(this.router.url);
  }

  logout(): void {
    this.store.logout();
    void this.router.navigateByUrl('/login');
  }

  private applyTitle(url: string): void {
    const myId = this.store.session()?.userId;
    const profilMatch = url.match(/^\/profil\/([^/?#]+)/);
    const profilUserId = profilMatch?.[1] ?? null;
    const isMaFiche =
      url.startsWith('/ma-fiche') || (!!myId && profilUserId === myId);

    this.showBackRecherche.set(!!profilUserId && !isMaFiche);

    if (isMaFiche) {
      this.title.set('Ma fiche');
      this.subtitle.set('Ta carte de visite pour l’entraide — par domaine et appétences');
    } else if (url.startsWith('/recherche')) {
      this.title.set('Recherche');
      this.subtitle.set('Décrire un besoin → filtrer → identifier → contacter');
    } else if (url.startsWith('/profil')) {
      this.title.set('Profil');
      this.subtitle.set('Trouve la bonne personne et prends contact');
    } else if (url.startsWith('/pilote')) {
      this.title.set('Espace pilote');
      this.subtitle.set('Membres DA3C et validation du référentiel');
    } else if (url.startsWith('/admin')) {
      this.title.set('Administration');
      this.subtitle.set('Communautés et nomination des pilotes');
    } else {
      this.title.set('Recherche');
      this.subtitle.set('Décrire un besoin → filtrer → identifier → contacter');
    }
  }
}
