import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http'; // <-- Importamos HttpClient para conectar NestJS
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
  private http = inject(HttpClient); // <-- Inyectamos HttpClient con la sintaxis moderna

  cursos = signal<Curso[]>([]);
  comunicados = signal<any[]>([]); // <-- Creamos un Signal para los comunicados de la BD

  ngOnInit(): void {
    // 1. Consultamos los cursos en base de datos para contar el total del estudiante
    const gradoConsulta = '1'; 

    this.cursoService.obtenerCursosPorGrado(gradoConsulta).subscribe({
      next: (data) => {
        this.cursos.set(data);
      },
      error: (err) => {
        console.error('Error al cargar métricas de inicio:', err);
      }
    });

    // 2. Consultamos los comunicados reales desde el backend de NestJS
    this.http.get<any[]>('http://localhost:3000/comunicado').subscribe({
      next: (data) => {
        // Mapeamos los datos para inyectarles el "tipo" visual dinámicamente según el título
        const datosConTipo = data.map(c => {
          let tipo = 'informativo'; // Por defecto (Azul)
          const t = c.titulo.toLowerCase();
          
          if (t.includes('reunión') || t.includes('suspensión') || t.includes('feriado')) {
            tipo = 'importante'; // Rojo
          } else if (t.includes('padre') || t.includes('actividades') || t.includes('evento')) {
            tipo = 'evento'; // Morado
          }
          
          return { ...c, tipo };
        });

        this.comunicados.set(datosConTipo);
      },
      error: (err) => {
        console.error('Error al cargar comunicados desde el backend:', err);
      }
    });
  }
}