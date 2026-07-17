import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface MaterialDocente {
  id_material: number;
  titulo: string;
  descripcion?: string;
  url_archivo: string;
  fecha_publicacion: string;
}

interface NuevoMaterial {
  titulo: string;
  descripcion: string;
}

interface EstudianteCurso {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  estado: boolean;
}

@Component({
  selector: 'app-docente-curso-materiales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './curso-materiales.html',
  styleUrl: './curso-materiales.css',
})
export class CursoMateriales implements OnInit {
  idAsignacion = signal<number | null>(null);
  materiales = signal<MaterialDocente[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  error = signal<string | null>(null);

  modalMaterial = signal(false);
  modalEliminar = signal(false);
  idAEliminar = signal<number | null>(null);

  // Modal "estudiantes que reciben el material"
  modalEstudiantes = signal(false);
  estudiantes = signal<EstudianteCurso[]>([]);
  cargandoEstudiantes = signal(false);
  materialSeleccionado = signal<MaterialDocente | null>(null);

  nuevo: NuevoMaterial = this.materialVacio();
  private archivo: File | null = null;
  archivoNombre = '';

  private extensionesVisibles = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

  private mimePorExtensionMap: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const id = this.route.parent?.snapshot.paramMap.get('id');
    if (id) {
      this.idAsignacion.set(Number(id));
      this.cargarMateriales(Number(id));
    }
  }

  private cargarMateriales(id: number): void {
    this.cargando.set(true);
    this.http.get<MaterialDocente[]>(`${environment.apiUrl}/asignacion-curso/${id}/materiales`).subscribe({
      next: (data) => { this.materiales.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  puedeGuardar(): boolean {
    return !!this.nuevo.titulo.trim() && !!this.archivo;
  }

  abrirModalNuevo(): void {
    this.nuevo = this.materialVacio();
    this.archivo = null;
    this.archivoNombre = '';
    this.error.set(null);
    this.modalMaterial.set(true);
  }

  cerrarModal(): void {
    this.modalMaterial.set(false);
    this.modalEliminar.set(false);
    this.modalEstudiantes.set(false);
    this.idAEliminar.set(null);
    this.materialSeleccionado.set(null);
  }

  onArchivoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.archivo = file;
    this.archivoNombre = file?.name ?? '';
    input.value = '';
  }

  quitarArchivo(): void {
    this.archivo = null;
    this.archivoNombre = '';
  }

  guardar(): void {
    const id = this.idAsignacion();
    if (!id || !this.puedeGuardar() || !this.archivo) return;

    this.guardando.set(true);
    this.error.set(null);

    const formData = new FormData();
    formData.append('id_asignacion', String(id));
    formData.append('titulo', this.nuevo.titulo.trim());
    formData.append('descripcion', this.nuevo.descripcion.trim());
    formData.append('archivo', this.archivo);

    this.http.post<MaterialDocente>(`${environment.apiUrl}/material`, formData).subscribe({
      next: () => {
        this.cargarMateriales(id);
        this.guardando.set(false);
        this.cerrarModal();
      },
      error: () => {
        this.error.set('No se pudo subir el material.');
        this.guardando.set(false);
      },
    });
  }

  confirmarEliminar(id: number): void {
    this.idAEliminar.set(id);
    this.modalEliminar.set(true);
  }

  eliminar(): void {
    const id = this.idAEliminar();
    if (!id) return;

    this.http.delete(`${environment.apiUrl}/material/${id}`).subscribe({
      next: () => {
        this.materiales.update((lista) => lista.filter((m) => m.id_material !== id));
        this.cerrarModal();
      },
      error: () => {
        this.error.set('No se pudo eliminar el material.');
        this.cerrarModal();
      },
    });
  }

  trackByMaterial(_: number, m: MaterialDocente): number {
    return m.id_material;
  }

  private materialVacio(): NuevoMaterial {
    return { titulo: '', descripcion: '' };
  }

  private mimePorExtension(ext: string): string {
    return this.mimePorExtensionMap[ext] ?? 'application/octet-stream';
  }

  // ── Archivo: ver o descargar ─────────────────────────────

  abrirArchivo(m: MaterialDocente): void {
    const ext = m.url_archivo.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
    const id = m.id_material;
    const esVisible = this.extensionesVisibles.includes(ext);
    const modo = esVisible ? 'ver' : 'descargar';

    // Si es visible, abrimos la ventana de inmediato (sincrónico al clic)
    // para evitar que el navegador bloquee el pop-up.
    const ventana = esVisible ? window.open('', '_blank') : null;

    this.http.get(`${environment.apiUrl}/material/${id}/descargar?modo=${modo}`, {
      responseType: 'blob',
    }).subscribe({
      next: (blob) => {
        const tipoBlob = new Blob([blob], { type: blob.type || this.mimePorExtension(ext) });
        const url = window.URL.createObjectURL(tipoBlob);

        if (esVisible) {
          if (ventana) {
            ventana.location.href = url;
          } else {
            this.error.set('El navegador bloqueó la ventana emergente. Habilita los pop-ups para ver el archivo.');
          }
          setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
        } else {
          const a = document.createElement('a');
          a.href = url;
          a.download = `${m.titulo}.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      },
      error: () => {
        ventana?.close();
        this.error.set('No se pudo abrir el archivo.');
        console.error('Error descargando archivo');
      },
    });
  }

  // ── Modal: estudiantes que reciben el material ───────────

  verEstudiantes(m: MaterialDocente): void {
    this.materialSeleccionado.set(m);
    this.modalEstudiantes.set(true);

    const id = this.idAsignacion();
    if (!id) return;

    this.cargandoEstudiantes.set(true);
    this.http.get<EstudianteCurso[]>(`${environment.apiUrl}/asignacion-curso/${id}/estudiantes`).subscribe({
      next: (data) => {
        this.estudiantes.set(data);
        this.cargandoEstudiantes.set(false);
      },
      error: () => this.cargandoEstudiantes.set(false),
    });
  }

  trackByEstudiante(_: number, e: EstudianteCurso): number {
    return e.id_usuario;
  }
}