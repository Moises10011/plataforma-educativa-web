import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Docente {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  estado: boolean;
}

interface AsignacionCurso {
  id_asignacion: number;
  docente: { id_usuario: number; nombres: string; apellidos: string };
  curso: { id_curso: number; nombre: string };
  grado: { id_grado: number; nombre: string };
  seccion: { id_seccion: number; nombre: string };
  periodo: { id_periodo: number; nombre: string };
}

interface Curso {
  id_curso: number;
  nombre: string;
}

interface Grado {
  id_grado: number;
  nombre: string;
}

interface Seccion {
  id_seccion: number;
  nombre: string;
}

interface PeriodoAcademico {
  id_periodo: number;
  nombre: string;
  estado: boolean;
}

@Component({
  selector: 'app-admin-docentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './docentes.html',
  styleUrl: './docentes.css',
})
export class AdminDocentes implements OnInit {
  docentes = signal<Docente[]>([]);
  asignaciones = signal<AsignacionCurso[]>([]);
  cursos = signal<Curso[]>([]);
  grados = signal<Grado[]>([]);
  secciones = signal<Seccion[]>([]);
  periodos = signal<PeriodoAcademico[]>([]);
  cargando = signal(true);

  vistaActual = signal<'docentes' | 'asignaciones'>('docentes');
  modalAsignar = signal(false);
  modalEliminar = signal(false);
  asignacionAEliminar = signal<number | null>(null);

  nuevaAsignacion = {
    id_docente: null as number | null,
    id_curso: null as number | null,
    id_grado: null as number | null,
    id_seccion: null as number | null,
    id_periodo: null as number | null,
  };

  guardando = signal(false);
  error = signal('');

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarTodo();
  }

  cargarTodo(): void {
    this.http.get<Docente[]>(`${environment.apiUrl}/usuario`).subscribe({
      next: (data) => {
        this.docentes.set(data.filter((u: any) =>
          u.roles?.some((r: any) => r.nombre === 'Docente')
        ));
      },
    });

    this.http.get<AsignacionCurso[]>(`${environment.apiUrl}/asignacion-curso`).subscribe({
      next: (data) => { this.asignaciones.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });

    this.http.get<Curso[]>(`${environment.apiUrl}/curso`).subscribe({ next: (d) => this.cursos.set(d) });
    this.http.get<Grado[]>(`${environment.apiUrl}/grado`).subscribe({ next: (d) => this.grados.set(d) });
    this.http.get<Seccion[]>(`${environment.apiUrl}/seccion`).subscribe({ next: (d) => this.secciones.set(d) });
    this.http.get<PeriodoAcademico[]>(`${environment.apiUrl}/periodo-academico`).subscribe({ next: (d) => this.periodos.set(d) });
  }

  abrirModalAsignar(): void {
    this.nuevaAsignacion = { id_docente: null, id_curso: null, id_grado: null, id_seccion: null, id_periodo: null };
    this.error.set('');
    this.modalAsignar.set(true);
  }

  cerrarModal(): void {
    this.modalAsignar.set(false);
    this.modalEliminar.set(false);
  }

  guardarAsignacion(): void {
    const { id_docente, id_curso, id_grado, id_seccion, id_periodo } = this.nuevaAsignacion;
    if (!id_docente || !id_curso || !id_grado || !id_seccion || !id_periodo) {
      this.error.set('Completa todos los campos');
      return;
    }
    this.guardando.set(true);
    this.http.post(`${environment.apiUrl}/asignacion-curso`, this.nuevaAsignacion).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargarTodo();
      },
      error: () => {
        this.guardando.set(false);
        this.error.set('Error al guardar la asignación');
      },
    });
  }

  confirmarEliminar(id: number): void {
    this.asignacionAEliminar.set(id);
    this.modalEliminar.set(true);
  }

  eliminarAsignacion(): void {
    const id = this.asignacionAEliminar();
    if (!id) return;
    this.http.delete(`${environment.apiUrl}/asignacion-curso/${id}`).subscribe({
      next: () => {
        this.cerrarModal();
        this.cargarTodo();
      },
    });
  }

  nombreDocente(id: number): string {
    const d = this.docentes().find((x) => x.id_usuario === id);
    return d ? `${d.nombres} ${d.apellidos}` : '';
  }
}