import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
 
interface TareaDocente {
  id_tarea: number;
  titulo: string;
  descripcion: string;
  fecha_entrega: string;
  curso: { nombre: string };
  total_entregas?: number;
}
 
@Component({
  selector: 'app-docente-tareas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tareas.html',
  styleUrl: './tareas.css',
})
export class DocenteTareas implements OnInit {
  tareas = signal<TareaDocente[]>([]);
  cargando = signal(true);
 
  constructor(private http: HttpClient) {}
 
  ngOnInit(): void {
    this.http
      .get<TareaDocente[]>(`${environment.apiUrl}/tarea/docente/mis-tareas`)
      .subscribe({
        next: (data) => { this.tareas.set(data); this.cargando.set(false); },
        error: () => this.cargando.set(false),
      });
  }
 
  estaVencida(fecha: string): boolean {
    return new Date(fecha) < new Date();
  }
}