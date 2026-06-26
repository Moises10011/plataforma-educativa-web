import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './auth/login/login';
import { RecuperarPassword } from './auth/recuperar-password/recuperar-password';
import { RestablecerPassword } from './auth/restablecer-password/restablecer-password';
import { Layout } from './layout/layout';
import { roleGuard } from './core/guards/role-guard';

// Importamos tus tres componentes utilizando sus nombres reales de clase
import { Dashboard as AdminDashboard } from './admin/dashboard/dashboard';
import { DocenteDashboard } from './docente/dashboard/dashboard';
import { EstudianteDashboard } from './estudiante/dashboard/dashboard';

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
        component: AdminDashboard,
      },
    ],
  },
  {
    path: 'docente',
    component: Layout,
    //canActivate: [roleGuard],
    //data: { roles: ['Docente'] },
    children: [
      { 
        path: '', 
        component: DocenteDashboard 
      },
    ],
  },
  {
    path: 'estudiante',
    component: Layout,
    canActivate: [roleGuard],
    data: { roles: ['Estudiante'] },
    children: [
      { 
        path: '', 
        component: EstudianteDashboard 
      },
    ],
  },
];