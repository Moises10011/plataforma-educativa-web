import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface CursoDocente {
  id_asignacion: number;
  curso: { id_curso: number; nombre: string };
  grado: { nombre: string };
  seccion: { nombre: string };
  periodo: { nombre: string };
}

interface TareaDocente {
  id_tarea: number;
  titulo: string;
  descripcion: string;
  fecha_entrega: string;
  total_entregas?: number;
}

interface NuevaTarea {
  titulo: string;
  descripcion: string;
  fecha_entrega: string;
}

@Component({
  selector: 'app-docente-tareas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tareas.html',
  styleUrl: './tareas.css',
})
export class DocenteTareas implements OnInit {
  cursos = signal<CursoDocente[]>([]);
  tareas = signal<TareaDocente[]>([]);
  idAsignacionSeleccionada = signal<number | null>(null);
  cargandoCursos = signal(true);
  cargando = signal(false);
  guardando = signal(false);
  error = signal<string | null>(null);

  modalTarea = signal(false);
  modalEliminar = signal(false);
  idAEliminar = signal<number | null>(null);
  nueva: NuevaTarea = this.tareaVacia();

  cursoSeleccionado = computed(() =>
    this.cursos().find(c => c.id_asignacion === this.idAsignacionSeleccionada())
  );

  puedeGuardar = computed(() =>
    !!this.nueva.titulo.trim() && !!this.nueva.fecha_entrega
  );

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<{ asignaciones: CursoDocente[] }>('/api/usuario/docente/dashboard').subscribe({
      next: (data) => {
        this.cursos.set(data.asignaciones ?? []);
        this.cargandoCursos.set(false);
      },
      error: () => this.cargandoCursos.set(false),
    });
  }

  onCursoChange(idAsignacion: number | null): void {
    this.idAsignacionSeleccionada.set(idAsignacion);
    this.tareas.set([]);
    if (!idAsignacion) return;

    this.cargando.set(true);
    this.http.get<TareaDocente[]>(`/api/asignacion-curso/${idAsignacion}/tareas`).subscribe({
      next: (data) => {
        this.tareas.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  abrirModalNueva(): void {
    this.nueva = this.tareaVacia();
    this.error.set(null);
    this.modalTarea.set(true);
  }

  cerrarModal(): void {
    this.modalTarea.set(false);
    this.modalEliminar.set(false);
    this.idAEliminar.set(null);
  }

  guardar(): void {
    const id = this.idAsignacionSeleccionada();
    if (!id || !this.puedeGuardar()) return;

    this.guardando.set(true);
    this.error.set(null);

    this.http.post<TareaDocente>('/api/tarea', {
      id_asignacion: id,
      titulo: this.nueva.titulo.trim(),
      descripcion: this.nueva.descripcion.trim(),
      fecha_entrega: this.nueva.fecha_entrega,
    }).subscribe({
      next: () => {
        this.onCursoChange(id);
        this.guardando.set(false);
        this.cerrarModal();
      },
      error: () => {
        this.error.set('No se pudo crear la tarea.');
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

    this.http.delete(`/api/tarea/${id}`).subscribe({
      next: () => {
        this.tareas.update(lista => lista.filter(t => t.id_tarea !== id));
        this.cerrarModal();
      },
      error: () => {
        this.error.set('No se pudo eliminar la tarea.');
        this.cerrarModal();
      },
    });
  }

  estaVencida(fecha: string): boolean {
    return new Date(fecha) < new Date();
  }

  trackByTarea(_: number, t: TareaDocente): number {
    return t.id_tarea;
  }

  trackByCurso(_: number, c: CursoDocente): number {
    return c.id_asignacion;
  }

  private tareaVacia(): NuevaTarea {
    return { titulo: '', descripcion: '', fecha_entrega: '' };
  }
}