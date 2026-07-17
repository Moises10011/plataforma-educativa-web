import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface AsignacionDetalleEstudiante {
  id_asignacion: number;
  curso: { id_curso: number; nombre: string; descripcion?: string };
  grado: { nombre: string } | null;
  seccion: { nombre: string } | null;
  periodo: { nombre: string } | null;
  docente: { id_usuario: number; nombres: string; apellidos: string } | null;
}

@Component({
  selector: 'app-estudiante-curso-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './curso-detalle.html',
  styleUrl: './curso-detalle.css',
})
export class CursoDetalle implements OnInit {
  idCurso = signal<string | null>(null);
  asignacion = signal<AsignacionDetalleEstudiante | null>(null);
  cargando = signal(true);

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.idCurso.set(id);
      if (id) {
        this.cargando.set(true);
        this.cargarCurso(id);
      }
    });
  }

  private cargarCurso(id: string): void {
    // id acá es el id_curso (así navega el sidebar del estudiante)
    this.http
      .get<AsignacionDetalleEstudiante>(`${environment.apiUrl}/usuario/estudiante/curso/${id}`)
      .subscribe({
        next: (data) => { this.asignacion.set(data); this.cargando.set(false); },
        error: () => this.cargando.set(false),
      });
  }
}