import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './auth/login/login';
import { RecuperarPassword } from './auth/recuperar-password/recuperar-password';
import { RestablecerPassword } from './auth/restablecer-password/restablecer-password';
import { Layout } from './layout/layout';
import { roleGuard } from './core/guards/role-guard';
import { AccesoDenegadoComponent } from './core/components/acceso-denegado/acceso-denegado';

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
      { path: 'periodos', loadComponent: () => import('./admin/periodos/periodos').then(m => m.AdminPeriodos) },
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
      {
        path: 'cursos/:id',
        loadComponent: () => import('./docente/cursos/detalle/curso-detalle').then(m => m.CursoDetalle),
        children: [
          { path: '', redirectTo: 'tablon', pathMatch: 'full' },
          { path: 'tareas', loadComponent: () => import('./docente/cursos/detalle/tareas/curso-tareas').then(m => m.CursoTareas) },
          { path: 'materiales', loadComponent: () => import('./docente/cursos/detalle/materiales/curso-materiales').then(m => m.CursoMateriales) },
          { path: 'estudiantes', loadComponent: () => import('./docente/cursos/detalle/estudiantes/curso-estudiantes').then(m => m.CursoEstudiantes) },
        ],
      },
      // Evaluación
      { path: 'notas', loadComponent: () => import('./docente/notas/notas').then(m => m.DocenteNotas) },
      { path: 'asistencia', loadComponent: () => import('./docente/asistencia/asistencia').then(m => m.AsistenciaRegistroComponent) },
      // Comunicaciones
      { path: 'comunicados', loadComponent: () => import('./docente/comunicados/comunicados').then(m => m.DocenteComunicados) },
      //documentoa
      { path: 'documentos', loadComponent: () => import('./docente/documentos/documentos').then(m => m.DocenteDocumentos) },
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
      {
        path: 'cursos/:id',
        loadComponent: () => import('./estudiante/cursos/detalle/curso-detalle').then(m => m.CursoDetalle),
        children: [
          { path: '', redirectTo: 'tablon', pathMatch: 'full' },
          { path: 'tareas', loadComponent: () => import('./estudiante/cursos/detalle/tareas/curso-tareas').then(m => m.CursoTareas) },
          { path: 'materiales', loadComponent: () => import('./estudiante/cursos/detalle/materiales/curso-materiales').then(m => m.CursoMateriales) },
        ],
      },
      //horario
      {path: 'horario', loadComponent: () => import('./estudiante/horario/horario').then(m => m.EstudianteHorario) },
      //notas
      { path: 'notas', loadComponent: () => import('./estudiante/notas/notas').then(m => m.EstudianteNotas) },
      //Comunicados
      { path: 'comunicados', loadComponent: () => import('./estudiante/comunicados/comunicados').then(m => m.EstudianteComunicados) },
      // Wildcard dentro de estudiante
      { path: '**', redirectTo: '' },
    ],
  },

  // ─── Acceso Denegado ──────────────────────────────────────────────────────
  {
    path: 'acceso-denegado',
    component: AccesoDenegadoComponent,
  },

  // ─── Ruta no encontrada ───────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: '',
  },
];
