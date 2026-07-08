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

interface EntregaDocente {
  id_entrega: number;
  comentario: string | null;
  archivo: string | null;
  fecha_entrega: string | null;
  estado: string | null;
  estudiante: { id_usuario: number; nombres: string; apellidos: string };
}

interface TareaConEntregas {
  id_tarea: number;
  titulo: string;
  fecha_entrega: string;
  total_entregas: number;
  entregas?: EntregaDocente[];
  expandido?: boolean;
}

interface NuevaCalificacion {
  id_usuario_estudiante: number;
  valor: string;
  observacion: string;
}

@Component({
  selector: 'app-docente-notas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notas.html',
  styleUrl: './notas.css',
})
export class DocenteNotas implements OnInit {
  cursos = signal<CursoDocente[]>([]);
  tareas = signal<TareaConEntregas[]>([]);
  idAsignacionSeleccionada = signal<number | null>(null);
  cargandoCursos = signal(true);
  cargando = signal(false);
  guardando = signal(false);
  error = signal<string | null>(null);

  modalCalificar = signal(false);
  entregaSeleccionada = signal<EntregaDocente | null>(null);
  calificacion: NuevaCalificacion = this.calificacionVacia();

  cursoSeleccionado = computed(() =>
    this.cursos().find(c => c.id_asignacion === this.idAsignacionSeleccionada())
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
    this.http.get<TareaConEntregas[]>(`/api/asignacion-curso/${idAsignacion}/tareas`).subscribe({
      next: (data) => {
        this.tareas.set(data.map(t => ({ ...t, expandido: false })));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  toggleTarea(idTarea: number): void {
    const tarea = this.tareas().find(t => t.id_tarea === idTarea);
    if (!tarea) return;

    if (tarea.expandido) {
      this.tareas.update(lista =>
        lista.map(t => t.id_tarea === idTarea ? { ...t, expandido: false } : t)
      );
      return;
    }

    const id = this.idAsignacionSeleccionada();
    if (!id) return;

    this.http.get<EntregaDocente[]>(`/api/asignacion-curso/${id}/tareas/${idTarea}/entregas`).subscribe({
      next: (entregas) => {
        this.tareas.update(lista =>
          lista.map(t => t.id_tarea === idTarea ? { ...t, entregas, expandido: true } : t)
        );
      },
    });
  }

  abrirModalCalificar(entrega: EntregaDocente): void {
    this.entregaSeleccionada.set(entrega);
    this.calificacion = {
      id_usuario_estudiante: entrega.estudiante.id_usuario,
      valor: '',
      observacion: '',
    };
    this.error.set(null);
    this.modalCalificar.set(true);
  }

  cerrarModal(): void {
    this.modalCalificar.set(false);
    this.entregaSeleccionada.set(null);
  }

  calificar(): void {
    const entrega = this.entregaSeleccionada();
    if (!entrega || !this.calificacion.valor.trim()) return;

    this.guardando.set(true);
    this.error.set(null);

    this.http.post('/api/nota', {
      id_entrega: entrega.id_entrega,
      id_usuario_estudiante: this.calificacion.id_usuario_estudiante,
      valor: this.calificacion.valor,
      observacion: this.calificacion.observacion,
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
      },
      error: () => {
        this.error.set('No se pudo guardar la calificación.');
        this.guardando.set(false);
      },
    });
  }

  descargarEntrega(idEntrega: number): void {
    window.open(`/api/entrega-tarea/${idEntrega}/descargar`, '_blank');
  }

  trackByTarea(_: number, t: TareaConEntregas): number {
    return t.id_tarea;
  }

  trackByCurso(_: number, c: CursoDocente): number {
    return c.id_asignacion;
  }

  trackByEntrega(_: number, e: EntregaDocente): number {
    return e.id_entrega;
  }

  private calificacionVacia(): NuevaCalificacion {
    return { id_usuario_estudiante: 0, valor: '', observacion: '' };
  }
}