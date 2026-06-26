import { Component, signal, computed, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth';
import { environment } from '../../environments/environment';

interface SubMenuItem {
  etiqueta: string;
  ruta: string;
}

interface CategoriaMenu {
  etiqueta: string;
  icono: string;
  items: SubMenuItem[];
}

interface Institucion {
  nombre: string;
  logo?: string;
  direccion?: string;
}

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit {
  menuColapsado = signal(false);
  menuMovilAbierto = signal(false);
  menuPerfilAbierto = signal(false);
  categoriaAbierta = signal<string | null>('Gestion Academica');
  institucion = signal<Institucion | null>(null);

  constructor(
    public authService: AuthService,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.http.get<Institucion>(`${environment.apiUrl}/institucion`).subscribe({
      next: (data) => this.institucion.set(data),
    });
  }

  logoUrl = computed(() => {
    const logo = this.institucion()?.logo;
    if (!logo) return null;
    return `${environment.apiUrl}/uploads/institucion/${logo}`;
  });

  // ─── MENÚS POR ROL ────────────────────────────────────────────────────────

  categoriasMenu = computed<CategoriaMenu[]>(() => {
    if (this.authService.tieneRol('Administrador')) {
      return [
        {
          etiqueta: 'Gestion Academica',
          icono: 'academic',
          items: [
            { etiqueta: 'Estudiantes', ruta: '/admin/estudiantes' },
            { etiqueta: 'Docentes', ruta: '/admin/docentes' },
          ],
        },
        {
          etiqueta: 'Gestion Documental',
          icono: 'document',
          items: [
            { etiqueta: 'Documentos institucionales', ruta: '/admin/documentos/institucionales' },
            { etiqueta: 'Horarios', ruta: '/admin/documentos/horarios' },
            { etiqueta: 'Libretas', ruta: '/admin/documentos/libretas' },
          ],
        },
        {
          etiqueta: 'Comunicaciones',
          icono: 'megaphone',
          items: [
            { etiqueta: 'Comunicados', ruta: '/admin/comunicados' },
          ],
        },
        {
          etiqueta: 'Gestion Institucional',
          icono: 'building',
          items: [
            { etiqueta: 'Informacion del colegio', ruta: '/admin/institucion' },
            { etiqueta: 'Galeria', ruta: '/admin/galeria' },
          ],
        },
      ];
    }

    if (this.authService.tieneRol('Docente')) {
      return [
        {
          etiqueta: 'Mi Aula',
          icono: 'academic',
          items: [
            { etiqueta: 'Mis Cursos', ruta: '/docente/cursos' },
            { etiqueta: 'Mis Estudiantes', ruta: '/docente/estudiantes' },
          ],
        },
        {
          etiqueta: 'Actividades',
          icono: 'document',
          items: [
            { etiqueta: 'Tareas', ruta: '/docente/tareas' },
            { etiqueta: 'Materiales', ruta: '/docente/materiales' },
          ],
        },
        {
          etiqueta: 'Evaluacion',
          icono: 'chart',
          items: [
            { etiqueta: 'Notas', ruta: '/docente/notas' },
            { etiqueta: 'Asistencia', ruta: '/docente/asistencia' },
          ],
        },
        {
          etiqueta: 'Comunicaciones',
          icono: 'megaphone',
          items: [
            { etiqueta: 'Comunicados', ruta: '/docente/comunicados' },
          ],
        },
      ];
    }

    if (this.authService.tieneRol('Estudiante')) {
      return [
        {
          etiqueta: 'Mi Aprendizaje',
          icono: 'academic',
          items: [
            { etiqueta: 'Mis Cursos', ruta: '/estudiante/cursos' },
            { etiqueta: 'Materiales', ruta: '/estudiante/materiales' },
          ],
        },
        {
          etiqueta: 'Actividades',
          icono: 'document',
          items: [
            { etiqueta: 'Tareas', ruta: '/estudiante/tareas' },
            { etiqueta: 'Entregas', ruta: '/estudiante/entregas' },
          ],
        },
        {
          etiqueta: 'Mi Progreso',
          icono: 'chart',
          items: [
            { etiqueta: 'Mis Notas', ruta: '/estudiante/notas' },
            { etiqueta: 'Asistencia', ruta: '/estudiante/asistencia' },
          ],
        },
        {
          etiqueta: 'Comunicaciones',
          icono: 'megaphone',
          items: [
            { etiqueta: 'Comunicados', ruta: '/estudiante/comunicados' },
          ],
        },
      ];
    }

    return [];
  });

  etiquetaPanel = computed(() => {
    if (this.authService.tieneRol('Administrador')) return 'Panel Admin';
    if (this.authService.tieneRol('Docente')) return 'Panel Docente';
    if (this.authService.tieneRol('Estudiante')) return 'Panel Estudiante';
    return 'Panel';
  });

  iniciales = computed(() => {
    const nombre = this.authService.usuarioActual()?.nombres ?? '';
    const partes = nombre.trim().split(' ');
    if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
    return nombre.slice(0, 2).toUpperCase();
  });

  toggleMenuColapsado(): void {
    this.menuColapsado.set(!this.menuColapsado());
    if (this.menuColapsado()) this.categoriaAbierta.set(null);
  }

  toggleMenuMovil(): void {
    this.menuMovilAbierto.set(!this.menuMovilAbierto());
  }

  cerrarMenuMovil(): void {
    this.menuMovilAbierto.set(false);
  }

  toggleCategoria(etiqueta: string): void {
    if (this.menuColapsado()) this.menuColapsado.set(false);
    this.categoriaAbierta.set(
      this.categoriaAbierta() === etiqueta ? null : etiqueta,
    );
  }

  toggleMenuPerfil(): void {
    this.menuPerfilAbierto.set(!this.menuPerfilAbierto());
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}