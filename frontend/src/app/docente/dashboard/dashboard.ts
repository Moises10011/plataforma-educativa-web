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
  styleUrls: ['./dashboard.css'],
})
export class DocenteDashboard implements OnInit {
  estadisticas = signal<EstadisticasDocente | null>(null);
  cargando = signal(true);

  constructor(private http: HttpClient) {}

  /*ngOnInit(): void {
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
  }*/
    ngOnInit(): void {
    this.estadisticas.set({
      nombre: 'Docente Demo',
      cursos: [
        { id: 1, nombre: 'Matemática', grado: '1°', seccion: 'A' },
        { id: 2, nombre: 'Comunicación', grado: '2°', seccion: 'B' },
        { id: 3, nombre: 'Ciencia', grado: '3°', seccion: 'C' }
      ],
      totalEstudiantes: 120,
      asistenciasHoy: 35,
      totalTareas: 10,
      tareasPendientes: 3
    });

    this.cargando.set(false);
  }
}