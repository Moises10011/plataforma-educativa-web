import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface CursoDocente {
  id_asignacion: number;
  curso: {
    id_curso: number;
    nombre: string;
  };
  grado: {
    nombre: string;
  };
  seccion: {
    nombre: string;
  };
  periodo: {
    nombre: string;
  };
}

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

@Component({
  selector: 'app-docente-materiales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './materiales.html',
  styleUrl: './materiales.css',
})
export class DocenteMateriales implements OnInit {
  cursos = signal<CursoDocente[]>([]);
  materiales = signal<MaterialDocente[]>([]);
  idAsignacionSeleccionada = signal<number | null>(null);
  cargandoCursos = signal(true);
  cargando = signal(false);
  guardando = signal(false);
  error = signal<string | null>(null);

  modalMaterial = signal(false);
  modalEliminar = signal(false);
  idAEliminar = signal<number | null>(null);

  nuevo: NuevoMaterial = this.materialVacio();
  private archivo: File | null = null;
  archivoNombre = '';

  cursoSeleccionado = computed(() =>
    this.cursos().find(c => c.id_asignacion === this.idAsignacionSeleccionada())
  );

  puedeGuardar = computed(() =>
    !!this.nuevo.titulo.trim() && !!this.archivo
  );

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<{ asignaciones: CursoDocente[] }>(`${environment.apiUrl}/usuario/docente/dashboard`).subscribe({
      next: (data) => {
        this.cursos.set(data.asignaciones ?? []);
        this.cargandoCursos.set(false);
      },
      error: () => this.cargandoCursos.set(false),
    });
  }

  onCursoChange(idAsignacion: number | null): void {
    this.idAsignacionSeleccionada.set(idAsignacion);
    this.materiales.set([]);
    if (!idAsignacion) return;

    this.cargando.set(true);
    this.http.get<MaterialDocente[]>(`${environment.apiUrl}/asignacion-curso/${idAsignacion}/materiales`).subscribe({
      next: (data) => {
        this.materiales.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
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
    this.idAEliminar.set(null);
  }

  onArchivoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.archivo = file;
    this.archivoNombre = file?.name ?? '';
  }

  guardar(): void {
    const id = this.idAsignacionSeleccionada();
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
        this.onCursoChange(id);
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
        this.materiales.update(lista => lista.filter(m => m.id_material !== id));
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

  trackByCurso(_: number, c: CursoDocente): number {
    return c.id_asignacion;
  }

  private materialVacio(): NuevoMaterial {
    return { titulo: '', descripcion: '' };
  }
}
