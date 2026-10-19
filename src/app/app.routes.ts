import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { ShellComponent } from './layout/shell.component';
import { LoginComponent } from './pages/login/login.component';
import { MaFicheComponent } from './pages/ma-fiche/ma-fiche.component';
import { RechercheComponent } from './pages/recherche/recherche.component';
import { ProfilComponent } from './pages/profil/profil.component';
import { PiloteComponent } from './pages/pilote/pilote.component';
import { AdminComponent } from './pages/admin/admin.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'recherche' },
      { path: 'recherche', component: RechercheComponent },
      { path: 'ma-fiche', component: MaFicheComponent },
      { path: 'profil/:userId', component: ProfilComponent },
      { path: 'pilote', component: PiloteComponent },
      { path: 'admin', component: AdminComponent },
    ],
  },
  { path: '**', redirectTo: 'recherche' },
];
