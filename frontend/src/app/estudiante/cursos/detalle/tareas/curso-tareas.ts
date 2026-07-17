import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/services/auth';

interface TareaEstudiante {
  id_tarea: number;
  titulo: string;
  descripcion: string;
  fecha_entrega: string;
  archivos?: string[] | null;
}

interface EntregaTarea {
  id_entrega: number;
  id_tarea: number;
  id_usuario_estudiante: number;
  archivos?: string[] | null;
  nota?: 'AD' | 'A' | 'B' | 'C' | null;
}

@Component({
  selector: 'app-estudiante-curso-tareas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './curso-tareas.html',
})
export class CursoTareas implements OnInit {
  idAsignacion = signal<number | null>(null);
  tareas = signal<TareaEstudiante[]>([]);
  entregas = signal<EntregaTarea[]>([]);

  cargando = signal(true);
  enviando = signal<number | null>(null);
  error = signal<string | null>(null);

  tareaSeleccionada = signal<TareaEstudiante | null>(null);
  arrastrandoArchivo = signal(false);

  private archivosElegidos: File[] = [];
  archivosElegidosNombres = signal<string[]>([]);

  private extensionesVisibles = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    const id = this.route.parent?.snapshot.paramMap.get('id');
    if (id) {
      this.idAsignacion.set(Number(id));
      this.cargarTareas(Number(id));
      this.cargarEntregas();
    }
  }

  private cargarTareas(id: number): void {
    this.cargando.set(true);
    this.http.get<TareaEstudiante[]>(`${environment.apiUrl}/asignacion-curso/${id}/tareas`).subscribe({
      next: (data) => { this.tareas.set(data); this.cargando.set(false); },
      error: () => { this.error.set('No se pudieron cargar las tareas.'); this.cargando.set(false); },
    });
  }

  private cargarEntregas(): void {
    this.http.get<EntregaTarea[]>(`${environment.apiUrl}/entrega-tarea`).subscribe({
      next: (data) => this.entregas.set(data),
      error: () => {},
    });
  }

  entregaDe(idTarea: number): EntregaTarea | undefined {
    return this.entregas().find((e) => e.id_tarea === idTarea);
  }

  estado(tarea: TareaEstudiante): 'pendiente' | 'entregado' | 'vencido' {
    if (this.entregaDe(tarea.id_tarea)) return 'entregado';
    return this.estaVencida(tarea.fecha_entrega) ? 'vencido' : 'pendiente';
  }

  estaVencida(fecha: string): boolean {
    return new Date(fecha) < new Date();
  }

  badgeClase(estado: 'pendiente' | 'entregado' | 'vencido'): string {
    switch (estado) {
      case 'entregado': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'vencido': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-amber-50 text-amber-600 border-amber-200';
    }
  }

  badgeTexto(estado: 'pendiente' | 'entregado' | 'vencido'): string {
    switch (estado) {
      case 'entregado': return 'Entregado';
      case 'vencido': return 'Vencido';
      default: return 'Pendiente';
    }
  }

  iconoPorExtension(nombre: string): string {
    const ext = nombre.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'imagen';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx'].includes(ext)) return 'excel';
    if (['ppt', 'pptx'].includes(ext)) return 'ppt';
    return 'archivo';
  }

  nombreCorto(nombreArchivo: string): string {
    const partes = nombreArchivo.split('-');
    return partes.length > 1 ? partes.slice(1).join('-') : nombreArchivo;
  }

  abrirArchivo(nombreArchivo: string, carpeta: 'tareas' | 'entregas' = 'tareas', event?: Event): void {
    event?.stopPropagation();
    const url = `${environment.apiUrl.replace('/api', '')}/uploads/${carpeta}/${nombreArchivo}`;
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

  descargarArchivo(nombreArchivo: string, carpeta: 'tareas' | 'entregas' = 'tareas', event?: Event): void {
    event?.stopPropagation();
    const url = `${environment.apiUrl.replace('/api', '')}/uploads/${carpeta}/${nombreArchivo}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    link.click();
  }

  // ── Detalle / modal ─────────────────────────────────────

  abrirTarea(tarea: TareaEstudiante): void {
    this.tareaSeleccionada.set(tarea);
    this.archivosElegidos = [];
    this.archivosElegidosNombres.set([]);
    this.error.set(null);
  }

  cerrarDetalle(): void {
    this.tareaSeleccionada.set(null);
    this.arrastrandoArchivo.set(false);
  }

  // ── Subida de la entrega (múltiples archivos) ────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.arrastrandoArchivo.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.arrastrandoArchivo.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.arrastrandoArchivo.set(false);
    const archivos = event.dataTransfer?.files;
    if (archivos?.length) this.agregarArchivos(Array.from(archivos));
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.agregarArchivos(Array.from(input.files));
    input.value = '';
  }

  private agregarArchivos(nuevos: File[]): void {
    this.archivosElegidos = [...this.archivosElegidos, ...nuevos];
    this.archivosElegidosNombres.set(this.archivosElegidos.map((f) => f.name));
  }

  quitarArchivoElegido(index: number): void {
    this.archivosElegidos.splice(index, 1);
    this.archivosElegidosNombres.set(this.archivosElegidos.map((f) => f.name));
  }

  entregarTarea(tarea: TareaEstudiante): void {
    const usuario = this.auth.usuarioActual();
    if (!usuario || this.archivosElegidos.length === 0) return;

    this.enviando.set(tarea.id_tarea);
    this.error.set(null);

    const entregaExistente = this.entregaDe(tarea.id_tarea);
    const formData = new FormData();
    this.archivosElegidos.forEach((archivo) => formData.append('archivos', archivo));

    if (entregaExistente) {
      this.http
        .put<EntregaTarea>(`${environment.apiUrl}/entrega-tarea/${entregaExistente.id_entrega}`, formData)
        .subscribe({
          next: (actualizada) => {
            this.entregas.update((lista) =>
              lista.map((e) => (e.id_entrega === actualizada.id_entrega ? actualizada : e)),
            );
            this.enviando.set(null);
            this.cerrarDetalle();
          },
          error: () => {
            this.error.set('No se pudo actualizar tu entrega.');
            this.enviando.set(null);
          },
        });
    } else {
      formData.append('id_tarea', String(tarea.id_tarea));
      formData.append('id_usuario_estudiante', String(usuario.id_usuario));

      this.http.post<EntregaTarea>(`${environment.apiUrl}/entrega-tarea`, formData).subscribe({
        next: (nueva) => {
          this.entregas.update((lista) => [...lista, nueva]);
          this.enviando.set(null);
          this.cerrarDetalle();
        },
        error: () => {
          this.error.set('No se pudo enviar tu entrega.');
          this.enviando.set(null);
        },
      });
    }
  }

  trackByTarea(_: number, t: TareaEstudiante): number {
    return t.id_tarea;
  }
}