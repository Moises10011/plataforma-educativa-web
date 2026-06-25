import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Curso {
  id_curso: number;   // <-- Antes decía 'id', cambiamos a 'id_curso' como tu BD
  nombre: string;
  descripcion: string;
  // Estas tres las dejamos como opcionales por si tu backend hace un JOIN luego:
  profesor?: string;
  progreso?: number;
  estado?: string;
  icono?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CursoService {
  private http = inject(HttpClient);
  // Reemplaza con la URL real de tu API backend
  private apiUrl = 'http://localhost:3000/curso'; 

  // Este método pide al backend los cursos filtrados por el grado del alumno
  obtenerCursosPorGrado(grado: string): Observable<Curso[]> {
    return this.http.get<Curso[]>(`${this.apiUrl}/grado/${grado}`);
  }
}