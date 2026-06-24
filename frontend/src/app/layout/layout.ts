import { Component, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../core/services/auth';

interface SubMenuItem {
  etiqueta: string;
  ruta: string;
}

interface CategoriaMenu {
  etiqueta: string;
  icono: string;
  items: SubMenuItem[];
}

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  menuColapsado = signal(false);
  menuMovilAbierto = signal(false);
  menuPerfilAbierto = signal(false);
  categoriaAbierta = signal<string | null>(null);

  constructor(
    public authService: AuthService,
    private router: Router,
  ) {
    // Categoría inicial según rol
    if (this.authService.tieneRol('Administrador')) {
      this.categoriaAbierta.set('Gestion Academica');
    } else if (this.authService.tieneRol('Estudiante')) {
      this.categoriaAbierta.set('Mis Cursos');
    }
  }

  categoriasMenu = computed<CategoriaMenu[]>(() => {

    // ── ADMINISTRADOR ──────────────────────────────────────────────
    if (this.authService.tieneRol('Administrador')) {
      return [
        {
          etiqueta: 'Gestion Academica',
          icono: 'academic',
          items: [
            { etiqueta: 'Estudiantes', ruta: '/admin/estudiantes' },
            { etiqueta: 'Docentes',    ruta: '/admin/docentes'    },
          ],
        },
        {
          etiqueta: 'Gestion Documental',
          icono: 'document',
          items: [
            { etiqueta: 'Documentos institucionales', ruta: '/admin/documentos/institucionales' },
            { etiqueta: 'Horarios',                   ruta: '/admin/documentos/horarios'        },
            { etiqueta: 'Libretas',                   ruta: '/admin/documentos/libretas'        },
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
            { etiqueta: 'Galeria',                 ruta: '/admin/galeria'     },
          ],
        },
      ];
    }

    // ── ESTUDIANTE ─────────────────────────────────────────────────
    if (this.authService.tieneRol('Estudiante')) {
      return [
        {
          // Notas, materiales y tareas viven aquí → eliminados de las otras categorías
          etiqueta: 'Mis Cursos',
          icono: 'book-open',
          items: [
            { etiqueta: 'Lista de Cursos', ruta: '/estudiante/cursos'           },
            { etiqueta: 'Materiales',      ruta: '/estudiante/cursos/materiales' },
            { etiqueta: 'Tareas',          ruta: '/estudiante/cursos/tareas'     },
            { etiqueta: 'Notas',           ruta: '/estudiante/cursos/notas'      },
          ],
        },
        
        {
          // Solo libreta queda aquí; notas se consolidaron en Mis Cursos
          etiqueta: 'Mi Aprendizaje',
          icono: 'academic',
          items: [
            { etiqueta: 'Mi Libreta', ruta: '/estudiante/libreta' },
          ],
        },
        {
          // Solo documentos y horarios; tareas/materiales se consolidaron en Mis Cursos
          etiqueta: 'Recursos',
          icono: 'document',
          items: [
            { etiqueta: 'Documentos', ruta: '/estudiante/documentos' },
            { etiqueta: 'Horarios',   ruta: '/estudiante/horarios'   },
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

  iniciales = computed(() => {
    const nombre = this.authService.usuarioActual()?.nombres ?? '';
    const partes = nombre.trim().split(' ');
    if (partes.length >= 2) {
      return (partes[0][0] + partes[1][0]).toUpperCase();
    }
    return nombre.slice(0, 2).toUpperCase();
  });

  toggleMenuColapsado(): void {
    this.menuColapsado.set(!this.menuColapsado());
    if (this.menuColapsado()) {
      this.categoriaAbierta.set(null);
    }
  }

  toggleMenuMovil(): void {
    this.menuMovilAbierto.set(!this.menuMovilAbierto());
  }

  cerrarMenuMovil(): void {
    this.menuMovilAbierto.set(false);
  }

  toggleCategoria(etiqueta: string): void {
    if (this.menuColapsado()) {
      this.menuColapsado.set(false);
    }
    this.categoriaAbierta.set(this.categoriaAbierta() === etiqueta ? null : etiqueta);
  }

  toggleMenuPerfil(): void {
    this.menuPerfilAbierto.set(!this.menuPerfilAbierto());
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}