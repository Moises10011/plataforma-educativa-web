import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const rolesPermitidos = route.data['roles'] as string[] | undefined;

  if (!authService.estaLogueado()) {
    router.navigate(['/login']);
    return false;
  }

  if (!rolesPermitidos || rolesPermitidos.length === 0) {
    return true;
  }

  const tienePermiso = rolesPermitidos.some((rol) => authService.tieneRol(rol));

  if (!tienePermiso) {
    router.navigate(['/']);
    return false;
  }

  return true;
};