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
  id_periodo: number;
}

interface BimestreMini {
  id_bimestre: number;
  id_periodo: number;
  nombre: string;
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

interface NotaColumna {
  id: string;
  id_competencia: number;
  nombre: string;
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

  // ── Bimestres (catálogo fijo, creado por el admin al abrir el periodo) ───
  bimestres = signal<BimestreMini[]>([]);
  idBimestreSeleccionado = signal<number | null>(null);

  // ── Roster ──────────────────────────────────────────────────────────────
  estudiantes  = signal<EstudianteMini[]>([]);
  competencias = signal<CompetenciaMini[]>([]);

  // ── Notas dinámicas por competencia (columnas "Crear Nota") ────────────────
  notasPorCompetencia = signal<Map<number, NotaColumna[]>>(new Map());
  valoresNota          = signal<Map<string, EstadoNota>>(new Map());
  valoresNotaOriginal  = signal<Map<string, EstadoNota>>(new Map());
  cambiosPendientes    = signal<Set<string>>(new Set());

  notasDeCompetencia(id_competencia: number): NotaColumna[] {
    return this.notasPorCompetencia().get(id_competencia) ?? [];
  }

  // ── Modal 1: crear nota ──────────────────────────────────────────────────
  modalCrearNotaAbierto = signal(false);
  competenciaModalId = signal<number | null>(null);
  nombreNuevaNota = signal('');

  abrirModalCrearNota(id_competencia: number): void {
    this.competenciaModalId.set(id_competencia);
    this.nombreNuevaNota.set('');
    this.modalCrearNotaAbierto.set(true);
  }

  cerrarModalCrearNota(): void {
    this.modalCrearNotaAbierto.set(false);
  }

  confirmarCrearNota(): void {
    const id_competencia = this.competenciaModalId();
    const nombre = this.nombreNuevaNota().trim();
    if (!id_competencia || !nombre) return;

    const nueva: NotaColumna = { id: `nota_${Date.now()}`, id_competencia, nombre };
    const mapa = new Map(this.notasPorCompetencia());
    mapa.set(id_competencia, [...(mapa.get(id_competencia) ?? []), nueva]);
    this.notasPorCompetencia.set(mapa);

    this.modalCrearNotaAbierto.set(false);
  }

  // ── Modal 2: editar / eliminar columna de nota ──────────────────────────
  modalEditarNotaAbierto = signal(false);
  notaEditando = signal<NotaColumna | null>(null);
  nombreEditarNota = signal('');

  abrirModalEditarNota(nota: NotaColumna): void {
    this.notaEditando.set(nota);
    this.nombreEditarNota.set(nota.nombre);
    this.modalEditarNotaAbierto.set(true);
  }

  cerrarModalEditarNota(): void {
    this.modalEditarNotaAbierto.set(false);
    this.notaEditando.set(null);
  }

  guardarEdicionNota(): void {
    const nota = this.notaEditando();
    const nombre = this.nombreEditarNota().trim();
    if (!nota || !nombre) return;

    const mapa = new Map(this.notasPorCompetencia());
    const lista = (mapa.get(nota.id_competencia) ?? []).map((n) =>
      n.id === nota.id ? { ...n, nombre } : n,
    );
    mapa.set(nota.id_competencia, lista);
    this.notasPorCompetencia.set(mapa);

    this.cerrarModalEditarNota();
  }

  eliminarNotaColumna(): void {
    const nota = this.notaEditando();
    if (!nota) return;

    const mapa = new Map(this.notasPorCompetencia());
    const lista = (mapa.get(nota.id_competencia) ?? []).filter((n) => n.id !== nota.id);
    mapa.set(nota.id_competencia, lista);
    this.notasPorCompetencia.set(mapa);

    const valores = new Map(this.valoresNota());
    for (const clave of Array.from(valores.keys())) {
      if (clave.endsWith(`_${nota.id}`)) valores.delete(clave);
    }
    this.valoresNota.set(valores);

    this.cerrarModalEditarNota();
  }

  // ── Estado general ──────────────────────────────────────────────────────
  cargando  = signal(false);
  guardando = signal(false);
  error     = signal('');
  exito     = signal('');

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarAsignaciones();
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

  private cargarBimestres(): void {
    const id_periodo = this.asignacionActual()?.id_periodo;
    if (!id_periodo) return;

    this.http
      .get<BimestreMini[]>(`${environment.apiUrl}/bimestre?id_periodo=${id_periodo}`)
      .subscribe({
        next: (data) => this.bimestres.set(data),
        error: () => this.bimestres.set([]),
      });
  }

  seleccionarCurso(id: number): void {
    this.idAsignacionSeleccionada.set(id);
    this.idBimestreSeleccionado.set(null);
    this.limpiarTabla();
    this.cargarBimestres();
  }

  seleccionarBimestre(id: number): void {
    this.idBimestreSeleccionado.set(id);
    this.limpiarTabla();
    this.cargarSiListo();
  }

  private limpiarTabla(): void {
    this.cambiosPendientes.set(new Set());
    this.competencias.set([]);
    this.estudiantes.set([]);
    this.notasPorCompetencia.set(new Map());
    this.valoresNota.set(new Map());
    this.valoresNotaOriginal.set(new Map());
    this.modalCrearNotaAbierto.set(false);
    this.modalEditarNotaAbierto.set(false);
  }

  private cargarSiListo(): void {
    const idAsignacion = this.idAsignacionSeleccionada();
    const idBimestre = this.idBimestreSeleccionado();
    if (!idAsignacion || !idBimestre) return;

    this.cargando.set(true);
    this.error.set('');

    this.http
      .get<EstudianteMini[]>(`${environment.apiUrl}/asignacion-curso/${idAsignacion}/estudiantes`)
      .subscribe({
        next: (estudiantes) => {
          this.estudiantes.set(estudiantes);
          this.cargarCompetenciasYNotas(idAsignacion, idBimestre);
        },
        error: () => {
          this.cargando.set(false);
          this.error.set('Error al cargar los estudiantes');
        },
      });
  }

  private cargarCompetenciasYNotas(idAsignacion: number, idBimestre: number): void {
    this.http
      .get<CompetenciaMini[]>(`${environment.apiUrl}/asignacion-curso/${idAsignacion}/competencias`)
      .subscribe({
        next: (competencias) => {
          this.competencias.set(competencias);
          // NOTA: falta el endpoint que traiga las columnas de nota (NotaColumna)
          // ya creadas para este bimestre y sus valores (valoresNota).
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.error.set('Error al cargar las competencias');
        },
      });
  }

  // ── Celdas de nota ───────────────────────────────────────────────────────

  estadoCeldaNota(id_usuario: number, id_nota: string): EstadoNota {
    return this.valoresNota().get(`${id_usuario}_${id_nota}`) ?? '';
  }

  clickCeldaNota(id_usuario: number, id_nota: string): void {
    const clave     = `${id_usuario}_${id_nota}`;
    const actual    = this.valoresNota().get(clave) ?? '';
    const siguiente = CICLO[(CICLO.indexOf(actual) + 1) % CICLO.length];
    this.setCeldaNota(clave, siguiente);
  }

  borrarConTecla(event: KeyboardEvent, id_usuario: number, id_nota: string): void {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return;
    event.preventDefault();
    this.setCeldaNota(`${id_usuario}_${id_nota}`, '');
  }

  private setCeldaNota(clave: string, valor: EstadoNota): void {
    const nuevoMapa = new Map(this.valoresNota());
    valor === '' ? nuevoMapa.delete(clave) : nuevoMapa.set(clave, valor);
    this.valoresNota.set(nuevoMapa);

    const nuevosCambios = new Set(this.cambiosPendientes());
    nuevosCambios.add(clave);
    this.cambiosPendientes.set(nuevosCambios);
  }

  // ── Promedio por competencia (en vivo) ──────────────────────────────────

  promedioCompetencia(id_usuario: number, id_competencia: number): string {
    const notas = this.notasDeCompetencia(id_competencia);
    const valores = notas
      .map((n) => this.valoresNota().get(`${id_usuario}_${n.id}`))
      .filter((v): v is EstadoNota => !!v);

    if (valores.length === 0) return '';

    const suma = valores.reduce((acc, v) => acc + VALOR_A_PUNTOS[v], 0);
    return puntosAValor(suma / valores.length);
  }

  // ── Deshacer ────────────────────────────────────────────────────────────

  deshacer(): void {
    this.valoresNota.set(new Map(this.valoresNotaOriginal()));
    this.cambiosPendientes.set(new Set());
  }

  // ── Actualizar (recarga desde el servidor) ──────────────────────────────

  actualizar(): void {
    this.limpiarTabla();
    this.cargarSiListo();
    this.mostrarExito('Datos actualizados');
  }

  // ── Guardar ─────────────────────────────────────────────────────────────

  guardar(): void {
    const idAsignacion = this.idAsignacionSeleccionada();
    const idBimestre = this.idBimestreSeleccionado();
    if (!idAsignacion || !idBimestre || this.cambiosPendientes().size === 0) return;

    const notas: { id_usuario: number; id_nota: string; id_competencia: number; nombre: string; valor: string }[] = [];
    const eliminaciones: { id_usuario: number; id_nota: string }[] = [];

    for (const clave of this.cambiosPendientes()) {
      const idx = clave.indexOf('_nota_');
      if (idx === -1) continue;
      const id_usuario = Number(clave.slice(0, idx));
      const id_nota = clave.slice(idx + 1);
      const valor = this.valoresNota().get(clave) ?? '';

      const columna = this.competencias()
        .flatMap((c) => this.notasDeCompetencia(c.id_competencia))
        .find((n) => n.id === id_nota);

      if (valor && columna) {
        notas.push({ id_usuario, id_nota, id_competencia: columna.id_competencia, nombre: columna.nombre, valor });
      } else if (this.valoresNotaOriginal().has(clave)) {
        eliminaciones.push({ id_usuario, id_nota });
      }
    }

    if (notas.length === 0 && eliminaciones.length === 0) {
      this.mostrarExito('No hay cambios nuevos para guardar');
      this.cambiosPendientes.set(new Set());
      return;
    }

    this.guardando.set(true);
    this.error.set('');

    this.http
      .post(`${environment.apiUrl}/asignacion-curso/${idAsignacion}/notas/lote`, {
        id_bimestre: idBimestre,
        notas,
        eliminaciones,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.valoresNotaOriginal.set(new Map(this.valoresNota()));
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
    const idBimestre = this.idBimestreSeleccionado();
    if (!idAsignacion || !idBimestre) return;

    this.http
      .get(`${environment.apiUrl}/asignacion-curso/${idAsignacion}/notas/exportar/${idBimestre}`, {
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