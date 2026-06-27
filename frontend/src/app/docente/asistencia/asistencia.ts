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

interface EstudianteAsistencia {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  estado: 'presente' | 'ausente' | 'tardanza';
}

interface AsistenciaRegistro {
  id_asistencia: number;
  fecha: string;
  estado: 'presente' | 'ausente' | 'tardanza';
  estudiante: { id_usuario: number; nombres: string; apellidos: string };
}

interface ResumenAsistencia {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  presentes: number;
  ausentes: number;
  tardanzas: number;
}

@Component({
  selector: 'app-docente-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistencia.html',
  styleUrl: './asistencia.css',
})
export class DocenteAsistencia implements OnInit {
  cursos = signal<CursoDocente[]>([]);
  registros = signal<AsistenciaRegistro[]>([]);
  resumen = signal<ResumenAsistencia[]>([]);
  idAsignacionSeleccionada = signal<number | null>(null);
  cargandoCursos = signal(true);
  cargando = signal(false);
  guardando = signal(false);
  error = signal<string | null>(null);
  vistaActual = signal<'registros' | 'resumen'>('registros');

  modalTomarAsistencia = signal(false);
  estudiantesModal = signal<EstudianteAsistencia[]>([]);
  fechaHoy = new Date().toISOString().split('T')[0];

  cursoSeleccionado = computed(() =>
    this.cursos().find(c => c.id_asignacion === this.idAsignacionSeleccionada())
  );

  totales = computed(() => ({
    presentes: this.registros().filter(r => r.estado === 'presente').length,
    ausentes: this.registros().filter(r => r.estado === 'ausente').length,
    tardanzas: this.registros().filter(r => r.estado === 'tardanza').length,
  }));

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
    this.registros.set([]);
    this.resumen.set([]);
    if (!idAsignacion) return;

    this.cargando.set(true);
    this.http.get<AsistenciaRegistro[]>(`/api/asignacion-curso/${idAsignacion}/asistencia`).subscribe({
      next: (data) => {
        this.registros.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });

    this.http.get<ResumenAsistencia[]>(`/api/asignacion-curso/${idAsignacion}/asistencia/resumen`).subscribe({
      next: (data) => this.resumen.set(data),
    });
  }

  cambiarVista(vista: 'registros' | 'resumen'): void {
    this.vistaActual.set(vista);
  }

  abrirModalAsistencia(): void {
    const id = this.idAsignacionSeleccionada();
    if (!id) return;

    this.http.get<{ id_usuario: number; nombres: string; apellidos: string }[]>(
      `/api/asignacion-curso/${id}/estudiantes`
    ).subscribe({
      next: (data) => {
        this.estudiantesModal.set(
          data.map(e => ({ ...e, estado: 'presente' as const }))
        );
        this.error.set(null);
        this.modalTomarAsistencia.set(true);
      },
    });
  }

  cerrarModal(): void {
    this.modalTomarAsistencia.set(false);
    this.estudiantesModal.set([]);
  }

  setEstado(idUsuario: number, estado: 'presente' | 'ausente' | 'tardanza'): void {
    this.estudiantesModal.update(lista =>
      lista.map(e => e.id_usuario === idUsuario ? { ...e, estado } : e)
    );
  }

  guardarAsistencia(): void {
    const id = this.idAsignacionSeleccionada();
    if (!id) return;

    this.guardando.set(true);
    this.error.set(null);

    this.http.post(`/api/asignacion-curso/${id}/asistencia/lote`, {
      fecha: this.fechaHoy,
      registros: this.estudiantesModal().map(e => ({
        id_usuario: e.id_usuario,
        estado: e.estado,
      })),
    }).subscribe({
      next: () => {
        this.onCursoChange(id);
        this.guardando.set(false);
        this.cerrarModal();
      },
      error: () => {
        this.error.set('No se pudo guardar la asistencia.');
        this.guardando.set(false);
      },
    });
  }

  colorEstado(estado: string): string {
    if (estado === 'presente') return 'text-green-700 bg-green-100';
    if (estado === 'tardanza') return 'text-amber-700 bg-amber-100';
    return 'text-red-700 bg-red-100';
  }

  trackByRegistro(_: number, r: AsistenciaRegistro): number {
    return r.id_asistencia;
  }

  trackByCurso(_: number, c: CursoDocente): number {
    return c.id_asignacion;
  }

  trackByEstudiante(_: number, e: EstudianteAsistencia): number {
    return e.id_usuario;
  }

  trackByResumen(_: number, r: ResumenAsistencia): number {
    return r.id_usuario;
  }
}