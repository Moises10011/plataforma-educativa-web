import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CursoService, Curso } from '../../core/services/curso';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-estudiante-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class EstudianteDashboard implements OnInit {
  private cursoService = inject(CursoService);
  public authService = inject(AuthService);

  cursos = signal<Curso[]>([]);

  ngOnInit(): void {
    // Consultamos los cursos en base de datos para contar el total del estudiante
    const gradoConsulta = '1'; 

    this.cursoService.obtenerCursosPorGrado(gradoConsulta).subscribe({
      next: (data) => {
        this.cursos.set(data);
      },
      error: (err) => {
        console.error('Error al cargar métricas de inicio:', err);
      }
    });
  }
}