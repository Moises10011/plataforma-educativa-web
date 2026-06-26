import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
 
interface Entrega {
  id_entrega: number;
  fecha_entrega: string;
  comentario?: string;
  calificacion?: number;
  tarea: { titulo: string; curso: { nombre: string } };
}
 
@Component({
  selector: 'app-estudiante-entregas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entregas.html',
  styleUrl: './entregas.css',
})
export class EstudianteEntregas implements OnInit {
  entregas = signal<Entrega[]>([]);
  cargando = signal(true);
 
  constructor(private http: HttpClient) {}
 
  ngOnInit(): void {
    this.http
      .get<Entrega[]>(`${environment.apiUrl}/entrega-tarea/estudiante/mis-entregas`)
      .subscribe({
        next: (data) => { this.entregas.set(data); this.cargando.set(false); },
        error: () => this.cargando.set(false),
      });
  }
}