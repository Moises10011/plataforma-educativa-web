import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CursoService, Curso } from '../../../core/services/curso';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-lista-cursos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-cursos.html',
  styleUrl: './lista-cursos.css'
})
export class ListaCursos implements OnInit {
  private cursoService = inject(CursoService);
  public authService = inject(AuthService);

  cursos = signal<Curso[]>([]);
  cargando = signal<boolean>(true);

ngOnInit(): void {
    // 1. Obtenemos el id_grado del alumno (Ana está en 1ro, por ende es el ID 1)
    const gradoConsulta = '1'; 

    // 2. Enviamos el ID correcto al backend
    this.cursoService.obtenerCursosPorGrado(gradoConsulta).subscribe({
      next: (data) => {
        this.cursos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar tus cursos:', err);
        this.cargando.set(false);
      }
    });
  }
}