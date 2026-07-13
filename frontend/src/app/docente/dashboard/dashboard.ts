import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface AsignacionDocente {
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
  total_estudiantes: number;
}

interface DashboardResponse {
  perfil: {
    id_usuario: number;
    nombres: string;
    apellidos: string;
    correo: string;
    estado: boolean;
  };
  asignaciones: AsignacionDocente[];
  resumen: {
    total_cursos_asignados: number;
    total_secciones: number;
  };
}

interface EstadisticasDocente {
  nombre: string;
  cursos: AsignacionDocente[];
  totalEstudiantes: number;
  totalCursos: number;
  totalSecciones: number;
}

@Component({
  selector: 'app-docente-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DocenteDashboard implements OnInit {
  estadisticas = signal<EstadisticasDocente | null>(null);
  cargando = signal(true);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<DashboardResponse>(`${environment.apiUrl}/usuario/docente/dashboard`)
      .subscribe({
        next: (data) => {
          const totalEstudiantes = data.asignaciones.reduce(
            (sum, a) => sum + a.total_estudiantes,
            0
          );

          const estadisticas: EstadisticasDocente = {
            nombre: `${data.perfil.nombres} ${data.perfil.apellidos}`,
            cursos: data.asignaciones,
            totalEstudiantes,
            totalCursos: data.resumen.total_cursos_asignados,
            totalSecciones: data.resumen.total_secciones,
          };

          this.estadisticas.set(estadisticas);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
        },
      });
  }
}
