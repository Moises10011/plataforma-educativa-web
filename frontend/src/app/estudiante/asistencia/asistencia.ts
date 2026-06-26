import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
 
interface RegistroAsistencia {
  id_asistencia: number;
  fecha: string;
  estado: 'presente' | 'ausente' | 'tardanza';
  curso: { nombre: string };
}
 
@Component({
  selector: 'app-estudiante-asistencia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './asistencia.html',
  styleUrl: './asistencia.css',
})
export class EstudianteAsistencia implements OnInit {
  registros = signal<RegistroAsistencia[]>([]);
  cargando = signal(true);
 
  constructor(private http: HttpClient) {}
 
  ngOnInit(): void {
    this.http
      .get<RegistroAsistencia[]>(`${environment.apiUrl}/asistencia/estudiante/mi-asistencia`)
      .subscribe({
        next: (data) => { this.registros.set(data); this.cargando.set(false); },
        error: () => this.cargando.set(false),
      });
  }
 
  colorEstado(estado: string): string {
    if (estado === 'presente') return 'text-green-700 bg-green-100';
    if (estado === 'tardanza') return 'text-amber-700 bg-amber-100';
    return 'text-red-700 bg-red-100';
  }
}