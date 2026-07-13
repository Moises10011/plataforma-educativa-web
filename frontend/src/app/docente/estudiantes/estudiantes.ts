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

interface EstudianteDocente {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  estado: boolean;
}

@Component({
  selector: 'app-docente-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estudiantes.html',
  styleUrl: './estudiantes.css',
})
export class DocenteEstudiantes implements OnInit {
  cursos = signal<CursoDocente[]>([]);
  estudiantes = signal<EstudianteDocente[]>([]);
  idAsignacionSeleccionada = signal<number | null>(null);
  cargando = signal(false);
  cargandoCursos = signal(true);

  cursoSeleccionado = computed(() =>
    this.cursos().find(c => c.id_asignacion === this.idAsignacionSeleccionada())
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
    this.estudiantes.set([]);
    if (!idAsignacion) return;

    this.cargando.set(true);
    this.http.get<EstudianteDocente[]>(`${environment.apiUrl}/asignacion-curso/${idAsignacion}/estudiantes`).subscribe({
      next: (data) => {
        this.estudiantes.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  trackByEstudiante(_: number, e: EstudianteDocente): number {
    return e.id_usuario;
  }

  trackByCurso(_: number, c: CursoDocente): number {
    return c.id_asignacion;
  }
}
