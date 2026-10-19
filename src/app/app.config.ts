import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideIonicAngular({ mode: 'md' }),
    providePrimeNG({
      ripple: false,
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false,
          cssLayer: false,
        },
      },
      translation: {
        emptyMessage: 'Aucun résultat',
        emptyFilterMessage: 'Aucun résultat',
        emptySearchMessage: 'Aucun résultat',
        emptySelectionMessage: 'Aucun élément sélectionné',
        selectionMessage: '{0} éléments sélectionnés',
        searchMessage: '{0} résultats disponibles',
        clear: 'Effacer',
      },
    }),
  ],
};
