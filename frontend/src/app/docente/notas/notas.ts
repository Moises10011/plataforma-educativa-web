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

interface PeriodoMini {
  id_periodo: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: boolean;
}

interface CompetenciaMini {
  id_competencia: number;
  nombre: string;
}

interface EstudianteMini {
  id_usuario: number;
  nombres: string;
  apellidos: string;
}

interface NotaRegistro {
  id_nota: number;
  id_usuario_estudiante: number;
  id_competencia: number;
  valor: string;
}

type EstadoNota = '' | 'AD' | 'A' | 'B' | 'C';

const CICLO: EstadoNota[] = ['', 'AD', 'A', 'B', 'C'];
const VALOR_A_PUNTOS: Record<string, number> = { AD: 4, A: 3, B: 2, C: 1 };

function puntosAValor(p: number): EstadoNota {
  if (p >= 3.5) return 'AD';
  if (p >= 2.5) return 'A';
  if (p >= 1.5) return 'B';
  return 'C';
}

@Component({
  selector: 'app-notas-registro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notas.html',
  styleUrl: './notas.css',
})
export class DocenteNotas implements OnInit {

  // ── Cursos ──────────────────────────────────────────────────────────────
  asignaciones = signal<AsignacionMini[]>([]);
  idAsignacionSeleccionada = signal<number | null>(null);

  asignacionActual = computed(() =>
    this.asignaciones().find(
      (a) => a.id_asignacion === this.idAsignacionSeleccionada(),
    ) ?? null,
  );

  // ── Periodos (bimestre/trimestre) ─────────────────────────────────────────
  periodos = signal<PeriodoMini[]>([]);
  idPeriodoSeleccionado = signal<number | null>(null);

  // ── Roster y notas ───────────────────────────────────────────────────────
  estudiantes  = signal<EstudianteMini[]>([]);
  competencias = signal<CompetenciaMini[]>([]);
  mapaNotas         = signal<Map<string, EstadoNota>>(new Map());
  mapaNotasOriginal = signal<Map<string, EstadoNota>>(new Map());
  cambiosPendientes = signal<Set<string>>(new Set());

  // ── Estado general ──────────────────────────────────────────────────────
  cargando  = signal(false);
  guardando = signal(false);
  error     = signal('');
  exito     = signal('');

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarAsignaciones();
    this.cargarPeriodos();
  }

  private mostrarExito(msg: string): void {
    this.exito.set(msg);
    setTimeout(() => this.exito.set(''), 3000);
  }

  // ── Carga inicial ───────────────────────────────────────────────────────

  cargarAsignaciones(): void {
    this.http
      .get<AsignacionMini[]>(`${environment.apiUrl}/asignacion-curso/docente/mis-asignaciones`)
      .subscribe({
        next: (data) => this.asignaciones.set(data),
        error: () => this.asignaciones.set([]),
      });
  }

  cargarPeriodos(): void {
    this.http
      .get<PeriodoMini[]>(`${environment.apiUrl}/periodo-academico`)
      .subscribe({
        next: (data) => {
          const activos = data
            .filter((p) => p.estado)
            .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
          this.periodos.set(activos);
        },
        error: () => this.periodos.set([]),
      });
  }

  seleccionarCurso(id: number): void {
    this.idAsignacionSeleccionada.set(id);
    this.limpiarTabla();
    this.cargarSiListo();
  }

  seleccionarPeriodo(id: number): void {
    this.idPeriodoSeleccionado.set(id);
    this.limpiarTabla();
    this.cargarSiListo();
  }

  private limpiarTabla(): void {
    this.cambiosPendientes.set(new Set());
    this.competencias.set([]);
    this.estudiantes.set([]);
    this.mapaNotas.set(new Map());
    this.mapaNotasOriginal.set(new Map());
  }

  private cargarSiListo(): void {
    const idAsignacion = this.idAsignacionSeleccionada();
    const idPeriodo = this.idPeriodoSeleccionado();
    if (!idAsignacion || !idPeriodo) return;

    this.cargando.set(true);
    this.error.set('');

    this.http
      .get<EstudianteMini[]>(`${environment.apiUrl}/asignacion-curso/${idAsignacion}/estudiantes`)
      .subscribe({
        next: (estudiantes) => {
          this.estudiantes.set(estudiantes);
          this.cargarCompetenciasYNotas(idAsignacion, idPeriodo);
        },
        error: () => {
          this.cargando.set(false);
          this.error.set('Error al cargar los estudiantes');
        },
      });
  }

  private cargarCompetenciasYNotas(idAsignacion: number, idPeriodo: number): void {
    this.http
      .get<CompetenciaMini[]>(`${environment.apiUrl}/asignacion-curso/${idAsignacion}/competencias`)
      .subscribe({
        next: (competencias) => {
          this.competencias.set(competencias);

          this.http
            .get<NotaRegistro[]>(`${environment.apiUrl}/asignacion-curso/${idAsignacion}/notas/${idPeriodo}`)
            .subscribe({
              next: (notas) => {
                const mapa = new Map<string, EstadoNota>();
                for (const n of notas) {
                  mapa.set(`${n.id_usuario_estudiante}_${n.id_competencia}`, n.valor as EstadoNota);
                }
                this.mapaNotas.set(mapa);
                this.mapaNotasOriginal.set(new Map(mapa));
                this.cargando.set(false);
              },
              error: () => {
                this.mapaNotas.set(new Map());
                this.mapaNotasOriginal.set(new Map());
                this.cargando.set(false);
              },
            });
        },
        error: () => {
          this.cargando.set(false);
          this.error.set('Error al cargar las competencias');
        },
      });
  }

  // ── Celdas ──────────────────────────────────────────────────────────────

  estadoCelda(id_usuario: number, id_competencia: number): EstadoNota {
    return this.mapaNotas().get(`${id_usuario}_${id_competencia}`) ?? '';
  }

  clickCelda(id_usuario: number, id_competencia: number): void {
    const clave     = `${id_usuario}_${id_competencia}`;
    const actual    = this.mapaNotas().get(clave) ?? '';
    const siguiente = CICLO[(CICLO.indexOf(actual) + 1) % CICLO.length];
    this.setCelda(clave, siguiente);
  }

  borrarConTecla(event: KeyboardEvent, id_usuario: number, id_competencia: number): void {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    event.preventDefault();
    this.setCelda(`${id_usuario}_${id_competencia}`, '');
  }

  private setCelda(clave: string, valor: EstadoNota): void {
    const nuevoMapa = new Map(this.mapaNotas());
    valor === '' ? nuevoMapa.delete(clave) : nuevoMapa.set(clave, valor);
    this.mapaNotas.set(nuevoMapa);

    const nuevosCambios = new Set(this.cambiosPendientes());
    nuevosCambios.add(clave);
    this.cambiosPendientes.set(nuevosCambios);
  }

  // ── Promedio en vivo ──────────────────────────────────────────────────────

  promedioEstudiante(id_usuario: number): string {
    const valores = this.competencias()
      .map((c) => this.mapaNotas().get(`${id_usuario}_${c.id_competencia}`))
      .filter((v): v is EstadoNota => !!v);

    if (valores.length === 0) return '';

    const suma = valores.reduce((acc, v) => acc + VALOR_A_PUNTOS[v], 0);
    return puntosAValor(suma / valores.length);
  }

  // ── Deshacer ────────────────────────────────────────────────────────────

  deshacer(): void {
    this.mapaNotas.set(new Map(this.mapaNotasOriginal()));
    this.cambiosPendientes.set(new Set());
  }

  // ── Guardar ─────────────────────────────────────────────────────────────

  guardar(): void {
    const idAsignacion = this.idAsignacionSeleccionada();
    const idPeriodo = this.idPeriodoSeleccionado();
    if (!idAsignacion || !idPeriodo || this.cambiosPendientes().size === 0) return;

    const registros: { id_usuario: number; id_competencia: number; valor: string }[] = [];
    const eliminaciones: { id_usuario: number; id_competencia: number }[] = [];

    for (const clave of this.cambiosPendientes()) {
      const idx = clave.indexOf('_');
      const id_usuario = Number(clave.slice(0, idx));
      const id_competencia = Number(clave.slice(idx + 1));
      const valor = this.mapaNotas().get(clave) ?? '';

      if (valor) {
        registros.push({ id_usuario, id_competencia, valor });
      } else if (this.mapaNotasOriginal().has(clave)) {
        eliminaciones.push({ id_usuario, id_competencia });
      }
    }

    if (registros.length === 0 && eliminaciones.length === 0) {
      this.mostrarExito('No hay cambios nuevos para guardar');
      this.cambiosPendientes.set(new Set());
      return;
    }

    this.guardando.set(true);
    this.error.set('');

    this.http
      .post(`${environment.apiUrl}/asignacion-curso/${idAsignacion}/notas/lote`, {
        id_periodo: idPeriodo,
        registros,
        eliminaciones,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.mapaNotasOriginal.set(new Map(this.mapaNotas()));
          this.cambiosPendientes.set(new Set());
          this.mostrarExito('Notas guardadas correctamente');
        },
        error: () => {
          this.guardando.set(false);
          this.error.set('Error al guardar las notas');
        },
      });
  }

  exportar(): void {
    const idAsignacion = this.idAsignacionSeleccionada();
    const idPeriodo = this.idPeriodoSeleccionado();
    if (!idAsignacion || !idPeriodo) return;

    this.http
      .get(`${environment.apiUrl}/asignacion-curso/${idAsignacion}/notas/exportar/${idPeriodo}`, {
        responseType: 'blob',
      })
      .subscribe({
        next: (blob) => {
          const nombreCurso = this.asignacionActual()?.curso ?? 'curso';
          const url = window.URL.createObjectURL(blob);
          const enlace = document.createElement('a');
          enlace.href = url;
          enlace.download = `notas_${nombreCurso}.xlsx`;
          enlace.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => {
          this.error.set('Error al exportar las notas');
        },
      });
  }
}