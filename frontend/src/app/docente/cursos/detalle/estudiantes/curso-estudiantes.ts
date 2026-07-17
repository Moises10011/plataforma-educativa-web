import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface EstudianteDocente {
  id_usuario: number;
  dni?: string;
  nombres: string;
  apellidos: string;
  correo: string;
  estado: boolean;
}

@Component({
  selector: 'app-docente-curso-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './curso-estudiantes.html',
  styleUrl: './curso-estudiantes.css',
})
export class CursoEstudiantes implements OnInit {
  idAsignacion = signal<number | null>(null);
  estudiantes = signal<EstudianteDocente[]>([]);
  cargando = signal(true);
  exportando = signal(false);

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const id = this.route.parent?.snapshot.paramMap.get('id');
    if (id) {
      this.idAsignacion.set(Number(id));
      this.cargarEstudiantes(Number(id));
    }
  }

  private cargarEstudiantes(id: number): void {
    this.cargando.set(true);
    this.http.get<EstudianteDocente[]>(`${environment.apiUrl}/asignacion-curso/${id}/estudiantes`).subscribe({
      next: (data) => { this.estudiantes.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  trackByEstudiante(_: number, e: EstudianteDocente): number {
    return e.id_usuario;
  }

  exportarExcel(): void {
    const id = this.idAsignacion();
    if (!id) return;

    this.exportando.set(true);

    this.http
      .get(`${environment.apiUrl}/asignacion-curso/${id}/estudiantes/exportar`, {
        responseType: 'blob',
      })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const enlace = document.createElement('a');
          enlace.href = url;
          enlace.download = `estudiantes_${id}.xlsx`;
          enlace.click();
          window.URL.revokeObjectURL(url);
          this.exportando.set(false);
        },
        error: () => {
          console.error('Error al exportar estudiantes');
          this.exportando.set(false);
        },
      });
  }
}