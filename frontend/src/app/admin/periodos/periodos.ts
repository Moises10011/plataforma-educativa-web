import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface PeriodoAcademico {
  id_periodo: number;
  nombre: string;
  anio: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: boolean;
}

@Component({
  selector: 'app-admin-periodos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './periodos.html',
  styleUrl: './periodos.css',
})
export class AdminPeriodos implements OnInit {
  periodos = signal<PeriodoAcademico[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  error = signal('');

  modalNuevo = signal(false);
  modalEditar = signal(false);
  modalEliminar = signal(false);
  modalCerrar = signal(false);
  periodoSeleccionado = signal<PeriodoAcademico | null>(null);

  nuevoPeriodo = {
    nombre: '',
    anio: new Date().getFullYear(),
    fecha_inicio: '',
    fecha_fin: '',
    estado: true,
  };

  editarPeriodo = {
    id_periodo: 0,
    nombre: '',
    anio: new Date().getFullYear(),
    fecha_inicio: '',
    fecha_fin: '',
    estado: true,
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  cargarPeriodos(): void {
    this.cargando.set(true);
    this.http.get<PeriodoAcademico[]>(`${environment.apiUrl}/periodo-academico`).subscribe({
      next: (data) => {
        this.periodos.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error al cargar períodos');
        this.cargando.set(false);
      },
    });
  }

  abrirModalNuevo(): void {
    this.nuevoPeriodo = {
      nombre: '',
      anio: new Date().getFullYear(),
      fecha_inicio: '',
      fecha_fin: '',
      estado: true,
    };
    this.error.set('');
    this.modalNuevo.set(true);
  }

  abrirModalEditar(periodo: PeriodoAcademico): void {
    this.periodoSeleccionado.set(periodo);
    this.editarPeriodo = {
      id_periodo: periodo.id_periodo,
      nombre: periodo.nombre,
      anio: periodo.anio,
      fecha_inicio: periodo.fecha_inicio,
      fecha_fin: periodo.fecha_fin,
      estado: periodo.estado,
    };
    this.error.set('');
    this.modalEditar.set(true);
  }

  abrirModalEliminar(periodo: PeriodoAcademico): void {
    this.periodoSeleccionado.set(periodo);
    this.modalEliminar.set(true);
  }

  abrirModalCerrar(periodo: PeriodoAcademico): void {
    this.periodoSeleccionado.set(periodo);
    this.modalCerrar.set(true);
  }

  cerrarModal(): void {
    this.modalNuevo.set(false);
    this.modalEditar.set(false);
    this.modalEliminar.set(false);
    this.modalCerrar.set(false);
    this.periodoSeleccionado.set(null);
  }

  crearPeriodo(): void {
    const { nombre, anio, fecha_inicio, fecha_fin } = this.nuevoPeriodo;
    if (!nombre || !anio || !fecha_inicio || !fecha_fin) {
      this.error.set('Todos los campos son obligatorios');
      return;
    }

    this.guardando.set(true);
    this.error.set('');

    this.http.post<PeriodoAcademico>(`${environment.apiUrl}/periodo-academico`, this.nuevoPeriodo).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargarPeriodos();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al crear período');
      },
    });
  }

  actualizarPeriodo(): void {
    const { id_periodo, nombre, anio, fecha_inicio, fecha_fin, estado } = this.editarPeriodo;
    if (!nombre || !anio || !fecha_inicio || !fecha_fin) {
      this.error.set('Todos los campos son obligatorios');
      return;
    }

    this.guardando.set(true);
    this.error.set('');

    this.http.put<PeriodoAcademico>(`${environment.apiUrl}/periodo-academico/${id_periodo}`, this.editarPeriodo).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargarPeriodos();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al actualizar período');
      },
    });
  }

  eliminarPeriodo(): void {
    const id = this.periodoSeleccionado()?.id_periodo;
    if (!id) return;

    this.guardando.set(true);
    this.http.delete(`${environment.apiUrl}/periodo-academico/${id}`).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargarPeriodos();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al eliminar período');
      },
    });
  }

  cerrarPeriodo(): void {
    const id = this.periodoSeleccionado()?.id_periodo;
    if (!id) return;

    this.guardando.set(true);
    this.http.patch(`${environment.apiUrl}/periodo-academico/${id}/cerrar`, {}).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargarPeriodos();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al cerrar período');
      },
    });
  }

  get periodoActivo(): PeriodoAcademico | undefined {
    return this.periodos().find(p => p.estado);
  }

  get periodosInactivos(): PeriodoAcademico[] {
    return this.periodos().filter(p => !p.estado);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}