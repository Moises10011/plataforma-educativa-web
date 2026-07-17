import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface TareaDocente {
  id_tarea: number;
  titulo: string;
  descripcion: string;
  fecha_entrega: string;
  total_entregas?: number;
  archivos?: string[] | null;
}

interface NuevaTarea {
  titulo: string;
  descripcion: string;
  fecha_entrega: string;
}

type NotaLetra = 'AD' | 'A' | 'B' | 'C';

interface EntregaTarea {
  id_entrega: number;
  id_tarea: number;
  id_usuario_estudiante: number;
  archivos?: string[] | null;
  nota?: NotaLetra | null;
  estudiante?: { nombres: string; apellidos: string };
  tarea?: { id_tarea: number };
}

@Component({
  selector: 'app-docente-curso-tareas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './curso-tareas.html',
  styleUrl: './curso-tareas.css',
})
export class CursoTareas implements OnInit {
  idAsignacion = signal<number | null>(null);
  tareas = signal<TareaDocente[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  error = signal<string | null>(null);

  modalTarea = signal(false);
  modalEliminar = signal(false);
  idAEliminar = signal<number | null>(null);
  nueva: NuevaTarea = this.tareaVacia();
  private archivos: File[] = [];
  archivosNombres: string[] = [];

  // Entregas
  tareaExpandida = signal<number | null>(null);
  entregas = signal<EntregaTarea[]>([]);
  cargandoEntregas = signal(false);
  guardandoNota = signal<number | null>(null);
  errorEntregas = signal<string | null>(null);

  notasDisponibles: NotaLetra[] = ['AD', 'A', 'B', 'C'];

  // AHORA — quita esa línea y agrega este método más abajo, junto a los otros métodos
  puedeGuardar(): boolean {
    return !!this.nueva.titulo.trim() && !!this.nueva.fecha_entrega;
  }

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const id = this.route.parent?.snapshot.paramMap.get('id');
    if (id) {
      this.idAsignacion.set(Number(id));
      this.cargarTareas(Number(id));
    }
  }

  private cargarTareas(id: number): void {
    this.cargando.set(true);
    this.http.get<TareaDocente[]>(`${environment.apiUrl}/asignacion-curso/${id}/tareas`).subscribe({
      next: (data) => { this.tareas.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  abrirModalNueva(): void {
    this.nueva = this.tareaVacia();
    this.archivos = [];
    this.archivosNombres = [];
    this.error.set(null);
    this.modalTarea.set(true);
  }

  cerrarModal(): void {
    this.modalTarea.set(false);
    this.modalEliminar.set(false);
    this.idAEliminar.set(null);
  }
  quitarArchivo(index: number): void {
    this.archivos.splice(index, 1);
    this.archivosNombres.splice(index, 1);
  }

  onArchivosChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const nuevos = input.files ? Array.from(input.files) : [];
    this.archivos = [...this.archivos, ...nuevos];
    this.archivosNombres = this.archivos.map((f) => f.name);
    input.value = ''; // permite volver a elegir el mismo archivo si lo borró antes
  }

  guardar(): void {
    const id = this.idAsignacion();
    if (!id || !this.puedeGuardar()) return;

    this.guardando.set(true);
    this.error.set(null);

    const formData = new FormData();
    formData.append('id_asignacion', String(id));
    formData.append('titulo', this.nueva.titulo.trim());
    formData.append('descripcion', this.nueva.descripcion.trim());
    formData.append('fecha_entrega', this.nueva.fecha_entrega);
    this.archivos.forEach((archivo) => formData.append('archivos', archivo));

    this.http.post<TareaDocente>(`${environment.apiUrl}/tarea`, formData).subscribe({
      next: () => {
        this.cargarTareas(id);
        this.guardando.set(false);
        this.cerrarModal();
      },
      error: () => {
        this.error.set('No se pudo crear la tarea.');
        this.guardando.set(false);
      },
    });
  }

  confirmarEliminar(id: number): void {
    this.idAEliminar.set(id);
    this.modalEliminar.set(true);
  }

  eliminar(): void {
    const id = this.idAEliminar();
    if (!id) return;

    this.http.delete(`${environment.apiUrl}/tarea/${id}`).subscribe({
      next: () => {
        this.tareas.update((lista) => lista.filter((t) => t.id_tarea !== id));
        if (this.tareaExpandida() === id) this.tareaExpandida.set(null);
        this.cerrarModal();
      },
      error: () => {
        this.error.set('No se pudo eliminar la tarea.');
        this.cerrarModal();
      },
    });
  }

  estaVencida(fecha: string): boolean {
    return new Date(fecha) < new Date();
  }

  trackByTarea(_: number, t: TareaDocente): number {
    return t.id_tarea;
  }
  private extensionesVisibles = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

  abrirArchivo(nombreArchivo: string): void {
    const url = `${environment.apiUrl.replace('/api', '')}/uploads/tareas/${nombreArchivo}`;
    const ext = nombreArchivo.split('.').pop()?.toLowerCase() ?? '';

    if (this.extensionesVisibles.includes(ext)) {
      window.open(url, '_blank');
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo;
      link.click();
    }
  }

  nombreCorto(nombreArchivo: string): string {
    // Multer suele guardar como "timestamp-nombreoriginal.ext"; muestro solo la parte legible
    const partes = nombreArchivo.split('-');
    return partes.length > 1 ? partes.slice(1).join('-') : nombreArchivo;
  }
  private tareaVacia(): NuevaTarea {
    return { titulo: '', descripcion: '', fecha_entrega: '' };
  }

  // ── Entregas ─────────────────────────────────────────────

  toggleEntregas(idTarea: number): void {
    if (this.tareaExpandida() === idTarea) {
      this.tareaExpandida.set(null);
      return;
    }
    this.tareaExpandida.set(idTarea);
    this.cargarEntregas(idTarea);
  }

  private cargarEntregas(idTarea: number): void {
    this.cargandoEntregas.set(true);
    this.errorEntregas.set(null);
    this.http.get<EntregaTarea[]>(`${environment.apiUrl}/entrega-tarea`).subscribe({
      next: (data) => {
        this.entregas.set(data.filter((e) => e.id_tarea === idTarea));
        this.cargandoEntregas.set(false);
      },
      error: () => {
        this.errorEntregas.set('No se pudieron cargar las entregas.');
        this.cargandoEntregas.set(false);
      },
    });
  }

  descargarEntrega(nombreArchivo: string): void {
    const url = `${environment.apiUrl.replace('/api', '')}/uploads/entregas/${nombreArchivo}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.click();
  }

  abrirEntrega(nombreArchivo: string): void {
    const url = `${environment.apiUrl.replace('/api', '')}/uploads/entregas/${nombreArchivo}`;
    const ext = nombreArchivo.split('.').pop()?.toLowerCase() ?? '';
    if (this.extensionesVisibles.includes(ext)) {
      window.open(url, '_blank');
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo;
      link.click();
    }
  }
  guardarNota(entrega: EntregaTarea, nota: NotaLetra): void {
    this.guardandoNota.set(entrega.id_entrega);
    this.http.put<EntregaTarea>(`${environment.apiUrl}/entrega-tarea/${entrega.id_entrega}/calificar`, { nota }).subscribe({
      next: (actualizada) => {
        this.entregas.update((lista) =>
          lista.map((e) => (e.id_entrega === entrega.id_entrega ? { ...e, nota: actualizada.nota } : e))
        );
        this.guardandoNota.set(null);
      },
      error: () => {
        this.errorEntregas.set('No se pudo guardar la nota. Verifica permisos del docente en el backend.');
        this.guardandoNota.set(null);
      },
    });
  }

  trackByEntrega(_: number, e: EntregaTarea): number {
    return e.id_entrega;
  }
}