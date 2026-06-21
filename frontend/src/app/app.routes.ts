import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './auth/login/login';
import { RecuperarPassword } from './auth/recuperar-password/recuperar-password';
import { RestablecerPassword } from './auth/restablecer-password/restablecer-password';

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
];