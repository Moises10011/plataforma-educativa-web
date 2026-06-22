import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface CursoNota {
  nombre: string;
  nota: number;
  asistencia: number;
}

interface EstadisticasEstudiante {
  nombre: string;
  grado: string;
  seccion: string;
  promedioGeneral: number;
  asistencias: number;
  inasistencias: number;
  tareasPendientes: number;
  cursos: CursoNota[];
}

@Component({
  selector: 'app-estudiante-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class EstudianteDashboard implements OnInit {
  estadisticas = signal<EstadisticasEstudiante | null>(null);
  cargando = signal(true);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<EstadisticasEstudiante>(`${environment.apiUrl}/usuario/estudiante/dashboard`)
      .subscribe({
        next: (data) => {
          this.estadisticas.set(data);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
        },
      });
  }
}