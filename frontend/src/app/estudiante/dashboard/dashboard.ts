import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth';
import { environment } from '../../../environments/environment';

interface MatriculaInfo {
  id_matricula: number;
  id_grado: number;
  id_seccion: number;
  estado: boolean;
  grado: { nombre: string };
  seccion: { nombre: string };
  periodo: { nombre: string };
}

interface TareaPendiente {
  id: number;
  curso: string;
  titulo: string;
  fecha_entrega: string;
}

interface Docente {
  id_usuario_docente: number;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  correo: string;
  curso: string;
}

@Component({
  selector: 'app-estudiante-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class EstudianteDashboard implements OnInit {
  cargando = signal(true);

  matricula = signal<MatriculaInfo | null>(null);
  tareas = signal<TareaPendiente[]>([]);
  docentes = signal<Docente[]>([]);

  busquedaDocente = signal('');
  docentesFiltrados = computed(() => {
    const texto = this.busquedaDocente().trim().toLowerCase();
    if (!texto) return this.docentes();
    return this.docentes().filter((d) =>
      d.nombre_completo.toLowerCase().includes(texto),
    );
  });

  constructor(public authService: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarTodo();
  }

  private cargarTodo(): void {
    // Matrícula del estudiante logueado
    this.http
      .get<MatriculaInfo[]>(`${environment.apiUrl}/matricula`)
      .subscribe({
        next: (data) => {
          const activa = data.find((m) => m.estado) ?? data[0] ?? null;
          this.matricula.set(activa);
        },
        error: () => this.matricula.set(null),
      });

    // Tareas pendientes
    this.http
      .get<TareaPendiente[]>(`${environment.apiUrl}/tarea/estudiante/pendientes`)
      .subscribe({
        next: (data) => this.tareas.set(data),
        error: () => this.tareas.set([]),
      });

    // Directorio de docentes
    this.http
      .get<Docente[]>(`${environment.apiUrl}/asignacion-curso/estudiante/mis-docentes`)
      .subscribe({
        next: (data) => {
          this.docentes.set(data);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  get nombreUsuario(): string {
    return this.authService.usuarioActual()?.nombres ?? 'Estudiante';
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
    });
  }
}