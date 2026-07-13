import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/** Estados posibles de un registro de asistencia diaria */
type EstadoAsistencia = 'presente' | 'ausente' | 'tardanza' | 'justificado';

interface CursoDocente {
  id_asignacion: number;
  curso: { id_curso: number; nombre: string };
  grado: { nombre: string };
  seccion: { nombre: string };
  periodo: { nombre: string };
}

interface EncabezadoCurso {
  institucion: string;
  docente: string;
  curso: string;
  nivel: string;
  grado: string;
  seccion: string;
  periodo: string;
}

interface EstudianteCurso {
  id_usuario: number;
  nombres: string;
  apellidos: string;
}

interface AsistenciaRegistro {
  id_asistencia: number;
  fecha: string;
  estado: EstadoAsistencia;
  estudiante: { id_usuario: number; nombres: string; apellidos: string };
}

/**
 * Respuesta reutilizada del endpoint mensual, de la cual solo tomamos
 * el encabezado institucional y la lista de estudiantes (roster).
 * Los campos de calendario (dias_del_mes, asistencia_diaria, resumen)
 * ya no se usan en esta vista.
 */
interface RespuestaRosterCurso {
  encabezado: EncabezadoCurso;
  estudiantes: EstudianteCurso[];
}

/** Dígito escrito en la celda -> estado real de asistencia. Fuente única de verdad. */
const DIGITO_A_ESTADO: Record<string, EstadoAsistencia> = {
  '1': 'presente',
  '0': 'ausente',
  '2': 'tardanza',
  '3': 'justificado',
};

/** Inverso del mapa anterior, para precargar los dígitos de registros ya guardados */
const ESTADO_A_DIGITO: Record<EstadoAsistencia, string> = {
  presente: '1',
  ausente: '0',
  tardanza: '2',
  justificado: '3',
};

/** Color de fondo por estado, para pintar la celda mientras se escribe */
const COLOR_FONDO_ASISTENCIA: Record<EstadoAsistencia, string> = {
  presente: '#2ecc71',
  ausente: '#e74c3c',
  tardanza: '#f1c40f',
  justificado: '#3498db',
};

/** Color de texto por estado */
const COLOR_TEXTO_ASISTENCIA: Record<EstadoAsistencia, string> = {
  presente: '#fff',
  ausente: '#fff',
  tardanza: '#333',
  justificado: '#fff',
};

const DIGITOS_VALIDOS = Object.keys(DIGITO_A_ESTADO);

@Component({
  selector: 'app-docente-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asistencia.html',
  styleUrl: './asistencia.css',
})
export class DocenteAsistencia implements OnInit {
  cursos = signal<CursoDocente[]>([]);
  cargandoCursos = signal(true);
  idAsignacionSeleccionada = signal<number | null>(null);

  cargandoRoster = signal(false);
  encabezado = signal<EncabezadoCurso | null>(null);
  estudiantes = signal<EstudianteCurso[]>([]);

  registros = signal<AsistenciaRegistro[]>([]);

  fecha = signal<string>(new Date().toISOString().split('T')[0]);
  valores = signal<Record<number, string | undefined>>({});

  guardando = signal(false);
  error = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  readonly digitosValidos = DIGITOS_VALIDOS;

  cursoSeleccionado = computed(() =>
    this.cursos().find((c) => c.id_asignacion === this.idAsignacionSeleccionada()),
  );

  /** Últimos registros guardados, más recientes primero, para el historial visible debajo de la hoja */
  historialReciente = computed(() =>
    [...this.registros()].sort((a, b) => (a.fecha < b.fecha ? 1 : -1)).slice(0, 30),
  );

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<{ asignaciones: CursoDocente[] }>(`${environment.apiUrl}/usuario/docente/dashboard`)
      .subscribe({
        next: (data) => {
          this.cursos.set(data.asignaciones ?? []);
          this.cargandoCursos.set(false);
        },
        error: () => this.cargandoCursos.set(false),
      });
  }

  onCursoChange(idAsignacion: number | null): void {
    this.idAsignacionSeleccionada.set(idAsignacion);
    this.encabezado.set(null);
    this.estudiantes.set([]);
    this.registros.set([]);
    this.valores.set({});
    this.error.set(null);
    this.mensajeExito.set(null);
    if (!idAsignacion) return;

    this.cargarRoster(idAsignacion);
    this.cargarRegistros(idAsignacion);
  }

  private cargarRoster(idAsignacion: number): void {
    this.cargandoRoster.set(true);
    const hoy = new Date();

    this.http
      .get<RespuestaRosterCurso>(
        `${environment.apiUrl}/asistencia/curso/${idAsignacion}/mes/${hoy.getMonth() + 1}/${hoy.getFullYear()}`,
      )
      .subscribe({
        next: (data) => {
          this.encabezado.set(data.encabezado);
          this.estudiantes.set(data.estudiantes ?? []);
          this.cargandoRoster.set(false);
          this.precargarValoresDeFecha();
        },
        error: () => this.cargandoRoster.set(false),
      });
  }

  private cargarRegistros(idAsignacion: number): void {
    this.http
      .get<AsistenciaRegistro[]>(`${environment.apiUrl}/asignacion-curso/${idAsignacion}/asistencia`)
      .subscribe({
        next: (data) => {
          this.registros.set(data);
          this.precargarValoresDeFecha();
        },
      });
  }

  // ---------- Fila de fecha + captura por dígitos ----------

  onFechaChange(nuevaFecha: string): void {
    this.fecha.set(nuevaFecha);
    this.mensajeExito.set(null);
    this.error.set(null);
    this.valores.set({});
    this.precargarValoresDeFecha();
  }

  /** Si ya existe asistencia guardada para la fecha seleccionada, precarga los dígitos */
  private precargarValoresDeFecha(): void {
    const fecha = this.fecha();
    const registrosDelDia = this.registros().filter((r) => r.fecha === fecha);
    if (registrosDelDia.length === 0) return;

    const nuevosValores: Record<number, string | undefined> = {};
    registrosDelDia.forEach((r) => {
      nuevosValores[r.estudiante.id_usuario] = ESTADO_A_DIGITO[r.estado];
    });
    this.valores.set(nuevosValores);
  }

  estadoDe(idUsuario: number): EstadoAsistencia | null {
    const digito = this.valores()[idUsuario];
    return digito ? (DIGITO_A_ESTADO[digito] ?? null) : null;
  }

  colorFondoCelda(idUsuario: number): string {
    const estado = this.estadoDe(idUsuario);
    return estado ? COLOR_FONDO_ASISTENCIA[estado] : '#ffffff';
  }

  colorTextoCelda(idUsuario: number): string {
    const estado = this.estadoDe(idUsuario);
    return estado ? COLOR_TEXTO_ASISTENCIA[estado] : '#333333';
  }

  onCeldaInput(idUsuario: number, valorCrudo: string, index: number): void {
    const digito = valorCrudo.slice(-1);
    const esValido = DIGITOS_VALIDOS.includes(digito);

    this.valores.update((actual) => ({
      ...actual,
      [idUsuario]: esValido ? digito : undefined,
    }));

    if (esValido) {
      this.enfocarCelda(index + 1);
    }
  }

  onCeldaKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'ArrowRight' || event.key === 'Enter') {
      event.preventDefault();
      this.enfocarCelda(index + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.enfocarCelda(index - 1);
    }
  }

  private enfocarCelda(index: number): void {
    const celdas = document.querySelectorAll<HTMLInputElement>('.celda-digito');
    const celda = celdas[index];
    celda?.focus();
    celda?.select();
  }

  // ---------- Guardado ----------

  guardarAsistencia(): void {
    const idAsignacion = this.idAsignacionSeleccionada();
    if (!idAsignacion) return;

    const valoresActuales = this.valores();
    const registrosAEnviar = this.estudiantes()
      .filter((e) => DIGITOS_VALIDOS.includes(valoresActuales[e.id_usuario] ?? ''))
      .map((e) => ({
        id_usuario: e.id_usuario,
        estado: DIGITO_A_ESTADO[valoresActuales[e.id_usuario]!],
      }));

    if (registrosAEnviar.length === 0) {
      this.error.set('Escribe al menos un dígito de asistencia (0-3) antes de guardar.');
      return;
    }

    this.guardando.set(true);
    this.error.set(null);
    this.mensajeExito.set(null);

    this.http
      .post(`${environment.apiUrl}/asignacion-curso/${idAsignacion}/asistencia/lote`, {
        fecha: this.fecha(),
        registros: registrosAEnviar,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.mensajeExito.set('Asistencia guardada correctamente.');
          this.cargarRegistros(idAsignacion);
        },
        error: () => {
          this.guardando.set(false);
          this.error.set('No se pudo guardar la asistencia.');
        },
      });
  }

  colorEstado(estado: string): string {
    const colores: Record<string, string> = {
      presente: 'text-green-700 bg-green-100',
      tardanza: 'text-amber-700 bg-amber-100',
      ausente: 'text-red-700 bg-red-100',
      justificado: 'text-blue-700 bg-blue-100',
    };
    return colores[estado] || 'text-gray-700 bg-gray-100';
  }

  trackByCurso(_index: number, c: CursoDocente): number {
    return c.id_asignacion;
  }

  trackByEstudiante(_index: number, e: EstudianteCurso): number {
    return e.id_usuario;
  }

  trackByRegistro(_index: number, r: AsistenciaRegistro): number {
    return r.id_asistencia;
  }
}