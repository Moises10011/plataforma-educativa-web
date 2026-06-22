import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './auth/login/login';
import { RecuperarPassword } from './auth/recuperar-password/recuperar-password';
import { RestablecerPassword } from './auth/restablecer-password/restablecer-password';
import { Layout } from './layout/layout';
import { Dashboard } from './admin/dashboard/dashboard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'recuperar-contrasena',
    component: RecuperarPassword,
  },
  {
    path: 'restablecer-contrasena',
    component: RestablecerPassword,
  },
  {
    path: 'admin',
    component: Layout,
    canActivate: [roleGuard],
    data: { roles: ['Administrador'] },
    children: [
      {
        path: '',
        component: Dashboard,
      },
    ],
  },
];