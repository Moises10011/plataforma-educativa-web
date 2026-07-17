import { Component, signal, computed, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth';
import { environment } from '../../environments/environment';

interface SubMenuItem {
  etiqueta: string;
  ruta: string;
  // Solo se usa en "Mis Cursos" del Estudiante: nombre del docente asignado.
  // null / undefined => aún no hay docente asignado a ese curso.
  docente?: string | null;
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

// Curso tal como lo devuelve el backend para el estudiante logueado.
interface CursoEstudiante {
  id: number;
  idAsignacion: number;
  nombre: string;
  docente: string | null;
}

// Forma real de la respuesta del endpoint GET /usuario/estudiante/cursos
interface CursoAsignacionResponse {
  id_asignacion: number;
  curso: { id_curso: number; nombre: string; descripcion?: string };
  docente: { id_usuario: number; nombres: string; apellidos: string } | null;
}

interface CursosEstudianteResponse {
  cursos: CursoAsignacionResponse[];
}

// Curso asignado al docente logueado (para su propio "Mis Cursos").
interface CursoDocente {
  id: number;
  nombre: string;
}

// Forma real de la respuesta del endpoint GET /usuario/docente/dashboard
interface AsignacionDocenteResponse {
  id_asignacion: number;
  curso: { id_curso: number; nombre: string; descripcion?: string };
  grado: { nombre: string };
  seccion: { nombre: string };
  periodo: { nombre: string };
  total_estudiantes: number;
}

interface DocenteDashboardResponse {
  asignaciones: AsignacionDocenteResponse[];
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
  categoriaAbierta = signal<string | null>(null);
  institucion = signal<Institucion | null>(null);

  // Cursos reales del estudiante logueado, cargados desde el backend.
  // El mismo listado de cursos aplica de 1° a 5°; lo que cambia es
  // simplemente qué cursos trae el endpoint según el grado/sección del alumno.
  cursosEstudiante = signal<CursoEstudiante[]>([]);

  // Cursos reales asignados al docente logueado.
  cursosDocente = signal<CursoDocente[]>([]);

  constructor(
    public authService: AuthService,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.http.get<Institucion>(`${environment.apiUrl}/institucion`).subscribe({
      next: (data) => this.institucion.set(data),
    });

    if (this.authService.tieneRol('Estudiante')) {
      this.cargarCursosEstudiante();
    }

    if (this.authService.tieneRol('Docente')) {
      this.cargarCursosDocente();
    }
  }

  private cargarCursosEstudiante(): void {
    this.http
      .get<CursosEstudianteResponse>(`${environment.apiUrl}/usuario/estudiante/cursos`)
      .subscribe({
        next: (data) => {
          const cursos = (data.cursos ?? []).map((item) => ({
            id: item.curso.id_curso,
            idAsignacion: item.id_asignacion,
            nombre: item.curso.nombre,
            docente: item.docente
              ? `${item.docente.nombres} ${item.docente.apellidos}`
              : null,
          }));
          this.cursosEstudiante.set(cursos);
        },
        error: () => this.cursosEstudiante.set([]),
      });
  }

  private cargarCursosDocente(): void {
    this.http
      .get<DocenteDashboardResponse>(`${environment.apiUrl}/usuario/docente/dashboard`)
      .subscribe({
        next: (data) => {
          const cursos = (data.asignaciones ?? []).map((item) => ({
            id: item.curso.id_curso,
            nombre: item.curso.nombre,
          }));
          this.cursosDocente.set(cursos);
        },
        error: () => this.cursosDocente.set([]),
      });
  }

  logoUrl = computed(() => {
    const logo = this.institucion()?.logo;
    if (!logo) return null;
    return `${environment.filesUrl}/uploads/institucion/${logo}`;
  });

  // Grado y sección del estudiante, para mostrar debajo de su nombre en el header.
  gradoSeccion = computed<string | null>(() => {
    const usuario = this.authService.usuarioActual() as any;
    const grado = usuario?.grado;
    const seccion = usuario?.seccion;
    if (!grado) return null;
    return seccion ? `Grado ${grado} - Sección ${seccion}` : `Grado ${grado}`;
  });

  categoriasMenu = computed<CategoriaMenu[]>(() => {
    if (this.authService.tieneRol('Administrador')) {
      return [
        {
          etiqueta: 'Gestión Académica',
          icono: 'academic',
          items: [
            { etiqueta: 'Estudiantes', ruta: '/admin/estudiantes' },
            { etiqueta: 'Docentes', ruta: '/admin/docentes' },
          ],
        },
        {
          etiqueta: 'Gestión Documental',
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
          etiqueta: 'Gestión Institucional',
          icono: 'building',
          items: [
            { etiqueta: 'Información del colegio', ruta: '/admin/institucion' },
            { etiqueta: 'Galería', ruta: '/admin/galeria' },
          ],
        },
      ];
    }

    if (this.authService.tieneRol('Docente')) {
      // "Mis Cursos" ahora es un desplegable con los cursos reales
      // asignados al docente (igual que en el Estudiante).
      // Evaluación y Comunicados quedan igual que antes.
      // Se agrega la categoría Documentos.
      return [
        {
          etiqueta: 'Mis Cursos',
          icono: 'academic',
          items: this.cursosDocente().map((curso) => ({
            etiqueta: curso.nombre,
            ruta: `/docente/cursos/${curso.id}`,
          })),
        },
        {
          etiqueta: 'Evaluación',
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
        {
          etiqueta: 'Documentos',
          icono: 'document',
          items: [
            { etiqueta: 'Documentos', ruta: '/docente/documentos' },
          ],
        },
      ];
    }

    if (this.authService.tieneRol('Estudiante')) {
      // Único bloque desplegable para el estudiante: sus cursos reales.
      // Solo se muestran (y se pueden abrir) los cursos que ya tienen
      // una asignación real (docente asignado); los que no, no aparecen
      // como enlace en el sidebar, ya que aún no tienen tablón/tareas/materiales.
      // "Comunicados" y "Notas" se muestran como enlaces directos en el template,
      // igual que "Dashboard", porque no necesitan submenú.
      return [
        {
          etiqueta: 'Mis Cursos',
          icono: 'academic',
          items: this.cursosEstudiante().map((curso) => ({
            etiqueta: curso.nombre,
            ruta: `/estudiante/cursos/${curso.id}`,
            docente: curso.docente,
          })),
        },
      ];
    }

    return [];
  });

  rutaDashboard = computed(() => {
    if (this.authService.tieneRol('Administrador')) return '/admin';
    if (this.authService.tieneRol('Docente')) return '/docente';
    if (this.authService.tieneRol('Estudiante')) return '/estudiante';
    return '/';
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

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}