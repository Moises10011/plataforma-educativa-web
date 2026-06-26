import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Curso {
  id_asignacion: number;
  curso: { id_curso: number; nombre: string; descripcion?: string };
  docente: { id_usuario: number; nombres: string; apellidos: string };
}

@Component({
  selector: 'app-estudiante-cursos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cursos.html',
  styleUrl: './cursos.css',
})
export class EstudianteCursos implements OnInit {
  cursos = signal<Curso[]>([]);
  cargando = signal(true);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<any>(`${environment.apiUrl}/usuario/estudiante/dashboard`)
      .subscribe({
        next: (data) => {
          this.cursos.set(data.cursos ?? []);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }
}