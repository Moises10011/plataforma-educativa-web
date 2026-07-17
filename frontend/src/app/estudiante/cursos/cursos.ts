import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Curso {
  id_asignacion: number;
  curso: { id_curso: number; nombre: string; descripcion?: string };
  docente: { id_usuario: number; nombres: string; apellidos: string } | null;
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
  filtroDocente = signal<'todos' | 'con-docente' | 'sin-docente'>('todos');

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<any>(`${environment.apiUrl}/usuario/estudiante/cursos`)
      .subscribe({
        next: (data) => {
          this.cursos.set(data.cursos ?? []);
          this.cargando.set(false);
        },
        error: (error) => {
          console.error('Error al cargar cursos:', error);
          this.cargando.set(false);
        },
      });
  }

  get cursosFiltrados(): Curso[] {
    const filtro = this.filtroDocente();
    if (filtro === 'todos') return this.cursos();
    
    return this.cursos().filter(c => {
      if (filtro === 'con-docente') return c.docente !== null;
      return c.docente === null;
    });
  }

  get totalCursos(): number {
    return this.cursos().length;
  }

  get cursosConDocente(): number {
    return this.cursos().filter(c => c.docente !== null).length;
  }

  get cursosSinDocente(): number {
    return this.cursos().filter(c => c.docente === null).length;
  }
}