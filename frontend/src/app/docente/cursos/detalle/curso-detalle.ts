import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface AsignacionDetalleDocente {
  id_asignacion: number;
  curso: { id_curso: number; nombre: string; descripcion?: string };
  grado: { nombre: string } | null;
  seccion: { nombre: string } | null;
  periodo: { nombre: string } | null;
}

@Component({
  selector: 'app-docente-curso-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './curso-detalle.html',
  styleUrl: './curso-detalle.css',
})
export class CursoDetalle implements OnInit {
  idAsignacion = signal<string | null>(null);
  asignacion = signal<AsignacionDetalleDocente | null>(null);
  cargando = signal(true);

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.idAsignacion.set(id);
      if (id) {
        this.cargando.set(true);
        this.cargarCurso(id);
      }
    });
  }

  private cargarCurso(id: string): void {
    this.http
      .get<AsignacionDetalleDocente>(`${environment.apiUrl}/usuario/docente/asignaciones/${id}`)
      .subscribe({
        next: (data) => { this.asignacion.set(data); this.cargando.set(false); },
        error: () => this.cargando.set(false),
      });
  }
}