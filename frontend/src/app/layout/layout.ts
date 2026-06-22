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
  categoriaAbierta = signal<string | null>('Gestion Academica');

  constructor(
    public authService: AuthService,
    private router: Router,
  ) {}

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