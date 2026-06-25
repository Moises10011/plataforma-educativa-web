import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './auth/login/login';
import { RecuperarPassword } from './auth/recuperar-password/recuperar-password';
import { RestablecerPassword } from './auth/restablecer-password/restablecer-password';
import { Layout } from './layout/layout';
import { roleGuard } from './core/guards/role-guard';

import { Dashboard as AdminDashboard } from './admin/dashboard/dashboard';
import { DocenteDashboard } from './docente/dashboard/dashboard';
import { EstudianteDashboard } from './estudiante/dashboard/dashboard';

import { ListaCursos } from './pages/estudiante/lista-cursos/lista-cursos';
import { Materiales } from './pages/estudiante/materiales/materiales';
import { Tareas } from './pages/estudiante/tareas/tareas';
import { Notas } from './pages/estudiante/notas/notas';
import { Libreta } from './pages/estudiante/libreta/libreta';
import { Documentos } from './pages/estudiante/documentos/documentos';
import { Horarios } from './pages/estudiante/horarios/horarios';
import { Comunicados } from './pages/estudiante/comunicados/comunicados';

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
    canActivate: [roleGuard],
    data: { roles: ['Docente'] },
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
    // canActivate: [roleGuard],
    // data: { roles: ['Estudiante'] },
    children: [
      { 
        path: '', 
        redirectTo: 'dashboard', // Si entra a /estudiante directo, lo manda al inicio
        pathMatch: 'full'
      },
      { 
        path: 'dashboard', // <-- Conectado con el item.ruta de tu menú
        component: EstudianteDashboard 
      },
      { 
        path: 'cursos', 
        component: ListaCursos 
      },
      { 
        path: 'cursos/materiales', 
        component: Materiales 
      },
      { 
        path: 'cursos/tareas', 
        component: Tareas 
      },
      { 
        path: 'cursos/notas', 
        component: Notas 
      },
      { 
        path: 'libreta', 
        component: Libreta 
      },
      { 
        path: 'documentos', 
        component: Documentos 
      },
      { 
        path: 'horarios', 
        component: Horarios 
      },
      { 
        path: 'comunicados', 
        component: Comunicados 
      },
    ],
  },
];