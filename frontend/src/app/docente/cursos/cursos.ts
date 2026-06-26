import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
 
interface CursoDocente {
  id_asignacion: number;
  curso: { id_curso: number; nombre: string; descripcion?: string };
  grado: { nombre: string };
  seccion: { nombre: string };
  periodo: { nombre: string };
  total_estudiantes: number;
}
 
@Component({
  selector: 'app-docente-cursos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cursos.html',
  styleUrl: './cursos.css',
})
export class DocenteCursos implements OnInit {
  cursos = signal<CursoDocente[]>([]);
  cargando = signal(true);
 
  constructor(private http: HttpClient) {}
 
  ngOnInit(): void {
    this.http
      .get<any>(`${environment.apiUrl}/usuario/docente/dashboard`)
      .subscribe({
        next: (data) => { this.cursos.set(data.asignaciones ?? []); this.cargando.set(false); },
        error: () => this.cargando.set(false),
      });
  }
}