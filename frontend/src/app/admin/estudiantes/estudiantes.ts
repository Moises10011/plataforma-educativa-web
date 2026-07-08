import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { environment } from '../../../environments/environment';

interface Matricula {
  id_matricula: number;
  usuario: { id_usuario: number; nombres: string; apellidos: string; correo: string; dni?: string };
  grado: { id_grado: number; nombre: string };
  seccion: { id_seccion: number; nombre: string };
  periodo: { id_periodo: number; nombre: string };
  estado: boolean;
}

interface Grado { id_grado: number; nombre: string; }
interface Seccion { id_seccion: number; nombre: string; }
interface PeriodoAcademico { id_periodo: number; nombre: string; estado: boolean; }

interface ResultadoMasivo {
  exitosos: { dni: string; nombre: string; correo: string }[];
  errores: { dni: string; nombre: string; error: string }[];
}

@Component({
  selector: 'app-admin-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estudiantes.html',
  styleUrl: './estudiantes.css',
})
export class AdminEstudiantes implements OnInit {
  matriculas = signal<Matricula[]>([]);
  grados = signal<Grado[]>([]);
  secciones = signal<Seccion[]>([]);
  periodos = signal<PeriodoAcademico[]>([]);
  cargando = signal(true);

  filtroGrado = signal<number | null>(null);
  filtroSeccion = signal<number | null>(null);
  filtroPeriodo = signal<number | null>(null);
  filtroBusqueda = signal('');

  tabActivo = signal<'individual' | 'masiva'>('individual');

  modalNuevo = signal(false);
  modalEditar = signal(false);
  modalEliminar = signal(false);
  modalResultado = signal(false);
  matriculaAEditar = signal<Matricula | null>(null);
  matriculaAEliminar = signal<number | null>(null);
  guardando = signal(false);
  exportando = signal(false);
  procesandoMasivo = signal(false);
  error = signal('');
  resultadoMasivo = signal<ResultadoMasivo | null>(null);

  nuevoEstudiante = {
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    direccion: '',
    fecha_nacimiento: '',
    id_grado: null as number | null,
    id_seccion: null as number | null,
    id_periodo: null as number | null,
  };

  editarForm = {
    id_matricula: 0,
    id_usuario: 0,
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    direccion: '',
    fecha_nacimiento: '',
    id_grado: null as number | null,
    id_seccion: null as number | null,
    id_periodo: null as number | null,
    estado: true,
  };

  archivoMasivo: File | null = null;
  filasMasivo: any[] = [];
  gradoMasivo = signal<number | null>(null);
  seccionMasivo = signal<number | null>(null);
  periodoMasivo = signal<number | null>(null);

  seccionesFiltradas = computed(() => this.secciones());
  seccionesFiltradasEditar = computed(() => this.secciones());
  seccionesFiltradasMasivo = computed(() => this.secciones());

  correoPreview = computed(() => {
    const dni = this.nuevoEstudiante.dni;
    return dni ? `${dni}@micaela.edu.pe` : '';
  });

  passwordPreview = computed(() => {
    const nombres = this.nuevoEstudiante.nombres;
    const dni = this.nuevoEstudiante.dni;
    if (!nombres || !dni) return '';
    return `${nombres.split(' ')[0]}${dni}`;
  });

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarMatriculas();
  }

  cargarCatalogos(): void {
    this.http.get<Grado[]>(`${environment.apiUrl}/grado`).subscribe({
      next: (d) => this.grados.set(d),
    });
    this.http.get<Seccion[]>(`${environment.apiUrl}/seccion`).subscribe({
      next: (d) => this.secciones.set(d),
    });
    this.http.get<PeriodoAcademico[]>(`${environment.apiUrl}/periodo-academico`).subscribe({
      next: (d) => {
        this.periodos.set(d);
        const activo = d.find(p => p.estado);
        if (activo) {
          this.filtroPeriodo.set(activo.id_periodo);
          this.nuevoEstudiante.id_periodo = activo.id_periodo;
          this.periodoMasivo.set(activo.id_periodo);
        }
      },
    });
  }

  cargarMatriculas(): void {
    this.cargando.set(true);
    this.http.get<Matricula[]>(`${environment.apiUrl}/matricula`).subscribe({
      next: (data) => { this.matriculas.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  get matriculasFiltradas(): Matricula[] {
    return this.matriculas().filter((m) => {
      if (this.filtroGrado() && m.grado.id_grado !== this.filtroGrado()) return false;
      if (this.filtroSeccion() && m.seccion.id_seccion !== this.filtroSeccion()) return false;
      if (this.filtroPeriodo() && m.periodo.id_periodo !== this.filtroPeriodo()) return false;
      const q = this.filtroBusqueda().toLowerCase();
      if (q) {
        const nombre = `${m.usuario.nombres} ${m.usuario.apellidos}`.toLowerCase();
        const correo = m.usuario.correo?.toLowerCase() ?? '';
        const dni = m.usuario.dni?.toLowerCase() ?? '';
        if (!nombre.includes(q) && !correo.includes(q) && !dni.includes(q)) return false;
      }
      return true;
    });
  }

  limpiarFiltros(): void {
    this.filtroGrado.set(null);
    this.filtroSeccion.set(null);
    this.filtroPeriodo.set(null);
    this.filtroBusqueda.set('');
  }

  abrirModalNuevo(): void {
    const activo = this.periodos().find(p => p.estado);
    this.nuevoEstudiante = {
      nombres: '', apellidos: '', dni: '', telefono: '',
      direccion: '', fecha_nacimiento: '',
      id_grado: null, id_seccion: null,
      id_periodo: activo?.id_periodo ?? null,
    };
    this.tabActivo.set('individual');
    this.error.set('');
    console.log('secciones cargadas:', this.secciones());
    console.log('id_seccion inicial:', this.nuevoEstudiante.id_seccion);
    this.modalNuevo.set(true);
  }

  onGradoChange(): void {
    this.nuevoEstudiante.id_seccion = null;
  }

  onGradoEditarChange(): void {
    this.editarForm.id_seccion = null;
  }

  onGradoMasivoChange(): void {
    this.seccionMasivo.set(null);
  }

  abrirModalEditar(m: Matricula): void {
    this.matriculaAEditar.set(m);
    this.editarForm = {
      id_matricula: m.id_matricula,
      id_usuario: m.usuario.id_usuario,
      nombres: m.usuario.nombres,
      apellidos: m.usuario.apellidos,
      dni: m.usuario.dni ?? '',
      telefono: '',
      direccion: '',
      fecha_nacimiento: '',
      id_grado: m.grado.id_grado,
      id_seccion: m.seccion.id_seccion,
      id_periodo: m.periodo.id_periodo,
      estado: m.estado,
    };
    this.error.set('');
    this.modalEditar.set(true);
  }
  cerrarModal(): void {
    this.modalNuevo.set(false);
    this.modalEditar.set(false);
    this.modalEliminar.set(false);
    this.modalResultado.set(false);
    this.archivoMasivo = null;
    this.filasMasivo = [];
  }

  matricular(): void {
    const { nombres, apellidos, dni, id_grado, id_seccion, id_periodo } = this.nuevoEstudiante;
    if (!nombres || !apellidos || !dni || !id_grado || !id_seccion || !id_periodo) {
      this.error.set('Nombres, apellidos, DNI, grado, sección y periodo son obligatorios');
      return;
    }
    this.guardando.set(true);
    this.http.post(`${environment.apiUrl}/usuario/crear-con-rol`, {
      ...this.nuevoEstudiante,
      rol: 'Estudiante',
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargarMatriculas();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al matricular');
      },
    });
  }

  guardarEdicion(): void {
    const m = this.matriculaAEditar();
    if (!m) return;
    this.guardando.set(true);

    const body = {
      usuario: {
        nombres: this.editarForm.nombres,
        apellidos: this.editarForm.apellidos,
        dni: this.editarForm.dni,
        telefono: this.editarForm.telefono,
        direccion: this.editarForm.direccion,
        fecha_nacimiento: this.editarForm.fecha_nacimiento,
      },
      matricula: {
        id_grado: this.editarForm.id_grado,
        id_seccion: this.editarForm.id_seccion,
        id_periodo: this.editarForm.id_periodo,
        estado: this.editarForm.estado,
      },
    };

    this.http.put(`${environment.apiUrl}/usuario/estudiante/${m.id_matricula}`, body).subscribe({
      next: () => { this.guardando.set(false); this.cerrarModal(); this.cargarMatriculas(); },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al actualizar');
      },
    });
  }
  confirmarEliminar(id: number): void {
    this.matriculaAEliminar.set(id);
    this.modalEliminar.set(true);
  }

  eliminar(): void {
    const id = this.matriculaAEliminar();
    if (!id) return;
    this.http.delete(`${environment.apiUrl}/matricula/${id}`).subscribe({
      next: () => { this.cerrarModal(); this.cargarMatriculas(); },
    });
  }

  // ─── CARGA MASIVA ──────────────────────────────────────────────────────────

  descargarPlantilla(): void {
    const datos = [
      {
        nombres: 'Juan Carlos',
        apellidos: 'Perez Lopez',
        dni: '12345678',
        telefono: '987654321',
        direccion: 'Av. Principal 123',
        fecha_nacimiento: '2010-05-15',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Estudiantes');
    XLSX.writeFile(wb, 'plantilla_estudiantes.xlsx');
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    this.archivoMasivo = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      this.filasMasivo = XLSX.utils.sheet_to_json(sheet);
    };
    reader.readAsArrayBuffer(file);
  }

  procesarMasivo(): void {
    if (!this.filasMasivo.length) {
      this.error.set('Sube un archivo Excel primero');
      return;
    }
    if (!this.gradoMasivo() || !this.seccionMasivo() || !this.periodoMasivo()) {
      this.error.set('Selecciona grado, sección y periodo');
      return;
    }

    const usuarios = this.filasMasivo.map((fila: any) => ({
      nombres: fila.nombres,
      apellidos: fila.apellidos,
      dni: String(fila.dni),
      telefono: fila.telefono ? String(fila.telefono) : undefined,
      direccion: fila.direccion ?? undefined,
      fecha_nacimiento: fila.fecha_nacimiento ?? undefined,
      rol: 'Estudiante',
      id_grado: this.gradoMasivo(),
      id_seccion: this.seccionMasivo(),
      id_periodo: this.periodoMasivo(),
    }));

    this.procesandoMasivo.set(true);
    this.error.set('');
    this.http.post<ResultadoMasivo>(`${environment.apiUrl}/usuario/crear-masivo`, { usuarios }).subscribe({
      next: (res) => {
        this.procesandoMasivo.set(false);
        this.resultadoMasivo.set(res);
        this.cerrarModal();
        this.modalResultado.set(true);
        this.cargarMatriculas();
      },
      error: (err) => {
        this.procesandoMasivo.set(false);
        this.error.set(err?.error?.message ?? 'Error al procesar');
      },
    });
  }

  exportar(): void {
    const id = this.filtroPeriodo();
    if (!id) { alert('Selecciona un periodo para exportar'); return; }
    this.exportando.set(true);
    this.http.get(`${environment.apiUrl}/matricula/exportar/${id}`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `matriculados_${id}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportando.set(false);
      },
      error: () => this.exportando.set(false),
    });
  }
}