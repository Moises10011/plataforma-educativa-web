import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface PeriodoAcademico { id_periodo: number; nombre: string; estado: boolean; }
interface Estudiante { id_usuario: number; nombres: string; apellidos: string; }

interface Libreta {
  id_libreta: number;
  estudiante: { id_usuario: number; nombres: string; apellidos: string };
  periodo: { id_periodo: number; nombre: string };
  archivo: string;
  fecha_subida: string;
}

@Component({
  selector: 'app-admin-libretas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './libretas.html',
  styleUrl: './libretas.css',
})
export class AdminLibretas implements OnInit {
  libretas = signal<Libreta[]>([]);
  estudiantes = signal<Estudiante[]>([]);
  periodos = signal<PeriodoAcademico[]>([]);
  cargando = signal(true);
  modalSubir = signal(false);
  modalEliminar = signal(false);
  idAEliminar = signal<number | null>(null);
  guardando = signal(false);
  error = signal('');

  filtroPeriodo = signal<number | null>(null);
  filtroBusqueda = signal('');

  nuevo = {
    id_estudiante: null as number | null,
    id_periodo: null as number | null,
  };
  archivoSeleccionado: File | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargar();
  }

  cargarCatalogos(): void {
    this.http.get<Estudiante[]>(`${environment.apiUrl}/usuario`).subscribe({
      next: (data) => this.estudiantes.set((data as any[]).filter((u) =>
        u.roles?.some((r: any) => r.nombre === 'Estudiante')
      )),
    });
    this.http.get<PeriodoAcademico[]>(`${environment.apiUrl}/periodo-academico`).subscribe({ next: (d) => this.periodos.set(d) });
  }

  cargar(): void {
    this.cargando.set(true);
    this.http.get<Libreta[]>(`${environment.apiUrl}/libreta`).subscribe({
      next: (data) => { this.libretas.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  get libretasFiltradas(): Libreta[] {
    return this.libretas().filter((l) => {
      if (this.filtroPeriodo() && l.periodo?.id_periodo !== this.filtroPeriodo()) return false;
      const q = this.filtroBusqueda().toLowerCase();
      if (q) {
        const nombre = `${l.estudiante?.nombres} ${l.estudiante?.apellidos}`.toLowerCase();
        if (!nombre.includes(q)) return false;
      }
      return true;
    });
  }

  abrirModal(): void {
    this.nuevo = { id_estudiante: null, id_periodo: null };
    this.archivoSeleccionado = null;
    this.error.set('');
    this.modalSubir.set(true);
  }

  cerrarModal(): void {
    this.modalSubir.set(false);
    this.modalEliminar.set(false);
  }

  onArchivoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado = input.files?.[0] ?? null;
  }

  guardar(): void {
    const { id_estudiante, id_periodo } = this.nuevo;
    if (!id_estudiante || !id_periodo || !this.archivoSeleccionado) {
      this.error.set('Completa todos los campos y selecciona un archivo');
      return;
    }
    this.guardando.set(true);
    const form = new FormData();
    form.append('id_estudiante', String(id_estudiante));
    form.append('id_periodo', String(id_periodo));
    form.append('archivo', this.archivoSeleccionado);

    this.http.post(`${environment.apiUrl}/libreta`, form).subscribe({
      next: () => { this.guardando.set(false); this.cerrarModal(); this.cargar(); },
      error: () => { this.guardando.set(false); this.error.set('Error al subir la libreta'); },
    });
  }

  confirmarEliminar(id: number): void {
    this.idAEliminar.set(id);
    this.modalEliminar.set(true);
  }

  eliminar(): void {
    const id = this.idAEliminar();
    if (!id) return;
    this.http.delete(`${environment.apiUrl}/libreta/${id}`).subscribe({
      next: () => { this.cerrarModal(); this.cargar(); },
    });
  }

  descargar(l: Libreta): void {
    window.open(`${environment.apiUrl}/uploads/libretas/${l.archivo}`, '_blank');
  }
}