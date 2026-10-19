import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DemoStoreService } from './demo-store.service';

export const authGuard: CanActivateFn = () => {
  const store = inject(DemoStoreService);
  const router = inject(Router);
  if (store.session()) return true;
  return router.createUrlTree(['/login']);
};
