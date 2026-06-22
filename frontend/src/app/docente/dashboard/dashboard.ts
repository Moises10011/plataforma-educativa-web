import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface CursoAsignado {
  id: number;
  nombre: string;
  grado: string;
  seccion: string;
}

interface EstadisticasDocente {
  nombre: string;
  cursos: CursoAsignado[];
  totalEstudiantes: number;
  asistenciasHoy: number;
  totalTareas: number;
  tareasPendientes: number;
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
      .get<EstadisticasDocente>(`${environment.apiUrl}/usuario/docente/dashboard`)
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