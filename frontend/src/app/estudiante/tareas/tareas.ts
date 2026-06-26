import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
 
interface Tarea {
  id_tarea: number;
  titulo: string;
  descripcion: string;
  fecha_entrega: string;
  estado: 'pendiente' | 'entregada' | 'calificada';
  curso: { nombre: string };
}
 
@Component({
  selector: 'app-estudiante-tareas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tareas.html',
  styleUrl: './tareas.css',
})
export class EstudianteTareas implements OnInit {
  tareas = signal<Tarea[]>([]);
  cargando = signal(true);
 
  constructor(private http: HttpClient) {}
 
  ngOnInit(): void {
    this.http
      .get<Tarea[]>(`${environment.apiUrl}/tarea/estudiante/mis-tareas`)
      .subscribe({
        next: (data) => { this.tareas.set(data); this.cargando.set(false); },
        error: () => this.cargando.set(false),
      });
  }
 
  estaVencida(fecha: string): boolean {
    return new Date(fecha) < new Date();
  }
}