import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface AsignacionMini {
  id_asignacion: number;
  curso: string;
  grado: string;
  seccion: string;
  periodo: string;
}

interface EstudianteMini {
  id_usuario: number;
  nombres: string;
  apellidos: string;
}

interface AsistenciaRegistro {
  id_asistencia: number;
  fecha: string;
  estado: string;
  estudiante: { id_usuario: number; nombres: string; apellidos: string };
}

interface ColumnaFecha {
  iso: string;       
  etiqueta: string;  
}

type EstadoAsistencia = '' | 'presente' | 'falta' | 'tardanza';

const CICLO: EstadoAsistencia[] = ['', 'presente', 'falta', 'tardanza'];

@Component({
  selector: 'app-asistencia-registro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistencia.html',
  styleUrl: './asistencia.css',
})
export class AsistenciaRegistroComponent implements OnInit {

  // ── Cursos ──────────────────────────────────────────────────────────────
  asignaciones = signal<AsignacionMini[]>([]);
  idAsignacionSeleccionada = signal<number | null>(null);

  asignacionActual = computed(() =>
    this.asignaciones().find(
      (a) => a.id_asignacion === this.idAsignacionSeleccionada(),
    ) ?? null,
  );

  // ── Roster y asistencia ─────────────────────────────────────────────────
  estudiantes  = signal<EstudianteMini[]>([]);
  columnas     = signal<ColumnaFecha[]>([]);
  /** clave: `${id_usuario}_${iso}` → estado */
  mapaAsistencia    = signal<Map<string, EstadoAsistencia>>(new Map());
  cambiosPendientes = signal<Set<string>>(new Set());

  // ── Modal agregar fecha ─────────────────────────────────────────────────
  modalFechaAbierto = signal(false);
  fechaInputValor   = signal('');

  // ── Selección de columna y eliminación de llamado ───────────────────────
  /** iso de la columna de fecha seleccionada (click en la cabecera) */
  isoSeleccionado = signal<string>('');
  modalEliminarFechaAbierto = signal(false);
  fechaAEliminar = computed(() => this.isoAEtiqueta(this.isoSeleccionado()));
  eliminando = signal(false);

  // ── Estado general ──────────────────────────────────────────────────────
  cargando  = signal(false);
  guardando = signal(false);
  error     = signal('');
  exito     = signal('');

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarAsignaciones();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private isoAEtiqueta(iso: string): string {
    if (!iso) return '';
    const [anio, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  private construirColumna(iso: string): ColumnaFecha {
    return { iso, etiqueta: this.isoAEtiqueta(iso) };
  }

  private mostrarExito(msg: string): void {
    this.exito.set(msg);
    setTimeout(() => this.exito.set(''), 3000);
  }

  // ── Carga de datos ──────────────────────────────────────────────────────

  cargarAsignaciones(): void {
    this.http
      .get<AsignacionMini[]>(
        `${environment.apiUrl}/asignacion-curso/docente/mis-asignaciones`,
      )
      .subscribe({
        next: (data) => this.asignaciones.set(data),
        error: () => this.asignaciones.set([]),
      });
  }

  seleccionarCurso(id: number): void {
    this.idAsignacionSeleccionada.set(id);
    this.cambiosPendientes.set(new Set());
    this.columnas.set([]);
    this.mapaAsistencia.set(new Map());
    this.isoSeleccionado.set('');
    this.cargarDatos();
  }

  private cargarDatos(): void {
    const id = this.idAsignacionSeleccionada();
    if (!id) return;

    this.cargando.set(true);
    this.error.set('');

    this.http
      .get<EstudianteMini[]>(`${environment.apiUrl}/asignacion-curso/${id}/estudiantes`)
      .subscribe({
        next: (data) => {
          this.estudiantes.set(data);
          this.cargarAsistenciaExistente(id);
        },
        error: () => {
          this.cargando.set(false);
          this.error.set('Error al cargar los estudiantes');
        },
      });
  }

  private cargarAsistenciaExistente(id: number): void {
    this.http
      .get<AsistenciaRegistro[]>(`${environment.apiUrl}/asignacion-curso/${id}/asistencia`)
      .subscribe({
        next: (data) => {
          const mapa = new Map<string, EstadoAsistencia>();
          const isosUnicos = new Set<string>();

          for (const r of data) {
            const iso = r.fecha.slice(0, 10);
            isosUnicos.add(iso);
            mapa.set(`${r.estudiante.id_usuario}_${iso}`, r.estado as EstadoAsistencia);
          }

          this.mapaAsistencia.set(mapa);
          this.columnas.set(
            Array.from(isosUnicos).sort().map((iso) => this.construirColumna(iso)),
          );
          this.cargando.set(false);
        },
        error: () => {
          this.mapaAsistencia.set(new Map());
          this.columnas.set([]);
          this.cargando.set(false);
        },
      });
  }

  // ── Celdas ──────────────────────────────────────────────────────────────

  estadoCelda(id_usuario: number, iso: string): EstadoAsistencia {
    return this.mapaAsistencia().get(`${id_usuario}_${iso}`) ?? '';
  }

  clickCelda(id_usuario: number, iso: string): void {
    const clave   = `${id_usuario}_${iso}`;
    const actual  = this.mapaAsistencia().get(clave) ?? '';
    const siguiente = CICLO[(CICLO.indexOf(actual) + 1) % CICLO.length];

    const nuevoMapa = new Map(this.mapaAsistencia());
    siguiente === '' ? nuevoMapa.delete(clave) : nuevoMapa.set(clave, siguiente);
    this.mapaAsistencia.set(nuevoMapa);

    const nuevosCambios = new Set(this.cambiosPendientes());
    nuevosCambios.add(clave);
    this.cambiosPendientes.set(nuevosCambios);
  }

  // ── Selección de columna de fecha ───────────────────────────────────────

  seleccionarFecha(iso: string): void {
    // click de nuevo sobre la misma columna la deselecciona
    this.isoSeleccionado.set(this.isoSeleccionado() === iso ? '' : iso);
  }

  // ── Modal agregar fecha ─────────────────────────────────────────────────

  abrirModalFecha(): void {
    const hoy = new Date();
    const mm  = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd  = String(hoy.getDate()).padStart(2, '0');
    this.fechaInputValor.set(`${hoy.getFullYear()}-${mm}-${dd}`);
    this.modalFechaAbierto.set(true);
  }

  cerrarModalFecha(): void { this.modalFechaAbierto.set(false); }

  confirmarFecha(): void {
    const iso = this.fechaInputValor();
    if (!iso) return;

    if (this.columnas().some((c) => c.iso === iso)) {
      this.error.set('Esa fecha ya está en la tabla');
      this.modalFechaAbierto.set(false);
      return;
    }

    const actualizadas = [...this.columnas(), this.construirColumna(iso)].sort(
      (a, b) => a.iso.localeCompare(b.iso),
    );
    this.columnas.set(actualizadas);
    this.modalFechaAbierto.set(false);
  }

  // ── Eliminar llamado de la fecha seleccionada ───────────────────────────

  solicitarEliminarFecha(): void {
    if (!this.isoSeleccionado()) return;
    this.modalEliminarFechaAbierto.set(true);
  }

  cerrarModalEliminarFecha(): void {
    this.modalEliminarFechaAbierto.set(false);
  }

  confirmarEliminarFecha(): void {
    const id  = this.idAsignacionSeleccionada();
    const iso = this.isoSeleccionado();
    if (!id || !iso) return;

    this.eliminando.set(true);
    this.error.set('');

    // DELETE /asistencia/fecha/{id_asignacion}/{yyyy-mm-dd}
    this.http
      .delete(`${environment.apiUrl}/asistencia/fecha/${id}/${iso}`)
      .subscribe({
        next: () => {
          this.columnas.set(this.columnas().filter((c) => c.iso !== iso));

          const nuevoMapa = new Map(this.mapaAsistencia());
          for (const clave of nuevoMapa.keys()) {
            if (clave.endsWith(`_${iso}`)) nuevoMapa.delete(clave);
          }
          this.mapaAsistencia.set(nuevoMapa);

          const nuevosCambios = new Set(this.cambiosPendientes());
          for (const clave of nuevosCambios) {
            if (clave.endsWith(`_${iso}`)) nuevosCambios.delete(clave);
          }
          this.cambiosPendientes.set(nuevosCambios);

          this.isoSeleccionado.set('');
          this.eliminando.set(false);
          this.cerrarModalEliminarFecha();
          this.mostrarExito('Llamado de asistencia eliminado correctamente');
        },
        error: () => {
          this.eliminando.set(false);
          this.error.set('Error al eliminar el llamado de asistencia');
        },
      });
  }

  // ── Guardar ─────────────────────────────────────────────────────────────

  guardar(): void {
    const id = this.idAsignacionSeleccionada();
    if (!id || this.cambiosPendientes().size === 0) return;

    const porFecha = new Map<string, { id_usuario: number; estado: string }[]>();

    for (const clave of this.cambiosPendientes()) {
      const idx       = clave.indexOf('_');
      const idUsuario = Number(clave.slice(0, idx));
      const iso       = clave.slice(idx + 1);
      const estado    = this.mapaAsistencia().get(clave) ?? '';
      if (!estado) continue;
      if (!porFecha.has(iso)) porFecha.set(iso, []);
      porFecha.get(iso)!.push({ id_usuario: idUsuario, estado });
    }

    const fechas = Array.from(porFecha.keys());
    if (fechas.length === 0) {
      this.mostrarExito('No hay cambios nuevos para guardar');
      return;
    }

    this.guardando.set(true);
    this.error.set('');

    let completados = 0;
    let hayError    = false;

    for (const fecha of fechas) {
      const registros = porFecha.get(fecha)!;
      this.http
        .post(`${environment.apiUrl}/asignacion-curso/${id}/asistencia/lote`, {
          fecha,
          registros,
        })
        .subscribe({
          next: () => {
            completados++;
            if (completados === fechas.length) {
              this.guardando.set(false);
              if (!hayError) {
                this.cambiosPendientes.set(new Set());
                this.mostrarExito('Asistencia guardada correctamente');
              }
            }
          },
          error: () => {
            hayError = true;
            completados++;
            this.guardando.set(false);
            this.error.set('Error al guardar algunos registros de asistencia');
          },
        });
    }
  }

  exportar(): void {
    const id = this.idAsignacionSeleccionada();
    if (!id) return;

    this.http
      .get(`${environment.apiUrl}/asistencia/exportar/${id}`, {
        responseType: 'blob',
      })
      .subscribe({
        next: (blob) => {
          const nombreCurso = this.asignacionActual()?.curso ?? 'curso';
          const url = window.URL.createObjectURL(blob);
          const enlace = document.createElement('a');
          enlace.href = url;
          enlace.download = `asistencia_${nombreCurso}.xlsx`;
          enlace.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          this.error.set('Error al exportar la asistencia');
        },
      });
  }
}