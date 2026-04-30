import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { catchError, map, of } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const api = inject(ApiService);

  return api.me().pipe(
    map((user) => {
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        return true;
      } else {
        router.navigate(['/home']);
        return false;
      }
    }),
    catchError(() => {
      router.navigate(['/login']);
      return of(false);
    })
  );
};
