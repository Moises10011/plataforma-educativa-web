import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

type TipoPeriodo = 'bimestral' | 'trimestral';

interface PeriodoAcademico {
  id_periodo: number;
  nombre: string;
  anio: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: boolean;
  tipo_periodo: TipoPeriodo;
}

interface Bimestre {
  id_bimestre: number;
  id_periodo: number;
  nombre: string;
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
    tipo_periodo: 'trimestral' as TipoPeriodo,
  };

  editarPeriodo = {
    id_periodo: 0,
    nombre: '',
    anio: new Date().getFullYear(),
    fecha_inicio: '',
    fecha_fin: '',
    estado: true,
    tipo_periodo: 'trimestral' as TipoPeriodo,
  };

  // ── Modal: gestionar bimestres de un período ──────────────────────────
  modalBimestres = signal(false);
  periodoBimestres = signal<PeriodoAcademico | null>(null);
  bimestres = signal<Bimestre[]>([]);
  cargandoBimestres = signal(false);
  errorBimestres = signal('');

  nombreNuevoBimestre = signal('');
  creandoBimestre = signal(false);
  eliminandoBimestreId = signal<number | null>(null);

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
      tipo_periodo: 'trimestral',
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
      tipo_periodo: periodo.tipo_periodo ?? 'trimestral',
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
    const { id_periodo, ...datosParaEnviar } = this.editarPeriodo;
    if (!datosParaEnviar.nombre || !datosParaEnviar.anio || !datosParaEnviar.fecha_inicio || !datosParaEnviar.fecha_fin) {
      this.error.set('Todos los campos son obligatorios');
      return;
    }

    this.guardando.set(true);
    this.error.set('');

    this.http.put<PeriodoAcademico>(`${environment.apiUrl}/periodo-academico/${id_periodo}`, datosParaEnviar).subscribe({
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

  // ── Modal: gestionar bimestres ────────────────────────────────────────

  abrirModalBimestres(periodo: PeriodoAcademico): void {
    this.periodoBimestres.set(periodo);
    this.nombreNuevoBimestre.set('');
    this.errorBimestres.set('');
    this.modalBimestres.set(true);
    this.cargarBimestresDePeriodo(periodo.id_periodo);
  }

  cerrarModalBimestres(): void {
    this.modalBimestres.set(false);
    this.periodoBimestres.set(null);
    this.bimestres.set([]);
  }

  private cargarBimestresDePeriodo(id_periodo: number): void {
    this.cargandoBimestres.set(true);
    this.http
      .get<Bimestre[]>(`${environment.apiUrl}/bimestre?id_periodo=${id_periodo}`)
      .subscribe({
        next: (data) => {
          this.bimestres.set(data);
          this.cargandoBimestres.set(false);
        },
        error: () => {
          this.errorBimestres.set('Error al cargar los bimestres');
          this.cargandoBimestres.set(false);
        },
      });
  }

  crearBimestreManual(): void {
    const id_periodo = this.periodoBimestres()?.id_periodo;
    const nombre = this.nombreNuevoBimestre().trim();
    if (!id_periodo || !nombre || this.creandoBimestre()) return;

    this.creandoBimestre.set(true);
    this.errorBimestres.set('');

    this.http
      .post<Bimestre>(`${environment.apiUrl}/bimestre`, { id_periodo, nombre, estado: true })
      .subscribe({
        next: (nuevo) => {
          this.bimestres.update((lista) => [...lista, nuevo]);
          this.nombreNuevoBimestre.set('');
          this.creandoBimestre.set(false);
        },
        error: (err) => {
          this.creandoBimestre.set(false);
          this.errorBimestres.set(err?.error?.message ?? 'Error al crear el bimestre');
        },
      });
  }

  eliminarBimestre(bimestre: Bimestre): void {
    const confirmado = window.confirm(
      `¿Eliminar "${bimestre.nombre}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmado) return;

    this.eliminandoBimestreId.set(bimestre.id_bimestre);
    this.errorBimestres.set('');

    this.http
      .delete(`${environment.apiUrl}/bimestre/${bimestre.id_bimestre}`)
      .subscribe({
        next: () => {
          this.bimestres.update((lista) =>
            lista.filter((b) => b.id_bimestre !== bimestre.id_bimestre),
          );
          this.eliminandoBimestreId.set(null);
        },
        error: (err) => {
          this.eliminandoBimestreId.set(null);
          this.errorBimestres.set(err?.error?.message ?? 'Error al eliminar el bimestre');
        },
      });
  }
}