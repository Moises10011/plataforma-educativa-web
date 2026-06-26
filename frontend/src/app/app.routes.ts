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

export const routes: Routes = [
  // ─── Públicas ─────────────────────────────────────────────────────────────
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

  // ─── Admin ────────────────────────────────────────────────────────────────
  {
    path: 'admin',
    component: Layout,
    canActivate: [roleGuard],
    data: { roles: ['Administrador'] },
    children: [
      { path: '', component: AdminDashboard },
      // Gestión académica
      { path: 'estudiantes', loadComponent: () => import('./admin/estudiantes/estudiantes').then(m => m.AdminEstudiantes) },
      { path: 'docentes', loadComponent: () => import('./admin/docentes/docentes').then(m => m.AdminDocentes) },
      // Gestión documental
      { path: 'documentos/institucionales', loadComponent: () => import('./admin/documentos/institucionales/institucionales').then(m => m.AdminInstitucionales) },
      { path: 'documentos/horarios', loadComponent: () => import('./admin/documentos/horarios/horarios').then(m => m.AdminHorarios) },
      { path: 'documentos/libretas', loadComponent: () => import('./admin/documentos/libretas/libretas').then(m => m.AdminLibretas) },
      // Comunicaciones
      { path: 'comunicados', loadComponent: () => import('./admin/comunicados/comunicados').then(m => m.AdminComunicados) },
      // Institucional
      { path: 'institucion', loadComponent: () => import('./admin/institucion/institucion').then(m => m.AdminInstitucion) },
      { path: 'galeria', loadComponent: () => import('./admin/galeria/galeria').then(m => m.AdminGaleria) },
      // Wildcard dentro de admin
      { path: '**', redirectTo: '' },
    ],
  },

  // ─── Docente ──────────────────────────────────────────────────────────────
  {
    path: 'docente',
    component: Layout,
    canActivate: [roleGuard],
    data: { roles: ['Docente'] },
    children: [
      { path: '', component: DocenteDashboard },
      // Mi Aula
      { path: 'cursos', loadComponent: () => import('./docente/cursos/cursos').then(m => m.DocenteCursos) },
      { path: 'estudiantes', loadComponent: () => import('./docente/estudiantes/estudiantes').then(m => m.DocenteEstudiantes) },
      // Actividades
      { path: 'tareas', loadComponent: () => import('./docente/tareas/tareas').then(m => m.DocenteTareas) },
      { path: 'materiales', loadComponent: () => import('./docente/materiales/materiales').then(m => m.DocenteMateriales) },
      // Evaluación
      { path: 'notas', loadComponent: () => import('./docente/notas/notas').then(m => m.DocenteNotas) },
      { path: 'asistencia', loadComponent: () => import('./docente/asistencia/asistencia').then(m => m.DocenteAsistencia) },
      // Comunicaciones
      { path: 'comunicados', loadComponent: () => import('./docente/comunicados/comunicados').then(m => m.DocenteComunicados) },
      // Wildcard dentro de docente
      { path: '**', redirectTo: '' },
    ],
  },

  // ─── Estudiante ───────────────────────────────────────────────────────────
  {
    path: 'estudiante',
    component: Layout,
    canActivate: [roleGuard],
    data: { roles: ['Estudiante'] },
    children: [
      { path: '', component: EstudianteDashboard },
      // Mi Aprendizaje
      { path: 'cursos', loadComponent: () => import('./estudiante/cursos/cursos').then(m => m.EstudianteCursos) },
      { path: 'materiales', loadComponent: () => import('./estudiante/materiales/materiales').then(m => m.EstudianteMateriales) },
      // Actividades
      { path: 'tareas', loadComponent: () => import('./estudiante/tareas/tareas').then(m => m.EstudianteTareas) },
      { path: 'entregas', loadComponent: () => import('./estudiante/entregas/entregas').then(m => m.EstudianteEntregas) },
      // Mi Progreso
      { path: 'notas', loadComponent: () => import('./estudiante/notas/notas').then(m => m.EstudianteNotas) },
      { path: 'asistencia', loadComponent: () => import('./estudiante/asistencia/asistencia').then(m => m.EstudianteAsistencia) },
      // Comunicaciones
      { path: 'comunicados', loadComponent: () => import('./estudiante/comunicados/comunicados').then(m => m.EstudianteComunicados) },
      // Wildcard dentro de estudiante
      { path: '**', redirectTo: '' },
    ],
  },

  // ─── Ruta no encontrada ───────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: '',
  },
];