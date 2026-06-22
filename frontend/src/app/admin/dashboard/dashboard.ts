import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface EstadisticasUsuarios {
  totalEstudiantes: number;
  totalDocentes: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  estadisticas = signal<EstadisticasUsuarios | null>(null);
  cargando = signal(true);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<EstadisticasUsuarios>(`${environment.apiUrl}/usuario/estadisticas/conteo`)
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