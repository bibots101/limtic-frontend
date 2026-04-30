import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const api = inject(ApiService);

  return api.me().pipe(
    map(() => true), // Si /me réussit, on est authentifié
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
