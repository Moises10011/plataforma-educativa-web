import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface EstudianteLibreta {
  id_matricula: number;
  id_estudiante: number;
  nombres: string;
  apellidos: string;
  dni: string;
  grado: string;
  seccion: string;
  tiene_libreta: boolean;
  libreta: {
    id_libreta: number;
    archivo: string;
    fecha_subida: string;
  } | null;
}

interface Grado {
  id_grado: number;
  nombre: string;
}

interface Seccion {
  id_seccion: number;
  nombre: string;
}

interface Periodo {
  id_periodo: number;
  nombre: string;
}

interface Libreta {
  id_libreta: number;
  id_estudiante: number;
  id_periodo: number;
  archivo: string;
  fecha_subida: string;
  estudiante: {
    nombres: string;
    apellidos: string;
    dni: string;
  };
  periodo: {
    nombre: string;
  };
}

@Component({
  selector: 'app-admin-libretas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './libretas.html',
  styleUrl: './libretas.css',
})
export class AdminLibretas implements OnInit {
  // Catálogos
  grados = signal<Grado[]>([]);
  secciones = signal<Seccion[]>([]);
  periodos = signal<Periodo[]>([]);

  // Filtros
  filtroGrado = signal<number | null>(null);
  filtroSeccion = signal<number | null>(null);
  filtroPeriodo = signal<number | null>(null);
  busqueda = signal('');

  // Datos
  estudiantes = signal<EstudianteLibreta[]>([]);
  libretas = signal<Libreta[]>([]);
  vistaActual = signal<'lista' | 'subida'>('lista');
  cargando = signal(false);
  error = signal('');

  // Subida masiva
  gradoSubida = signal<number | null>(null);
  seccionSubida = signal<number | null>(null);
  periodoSubida = signal<number | null>(null);
  archivosSeleccionados = signal<{ file: File; estudiante?: EstudianteLibreta }[]>([]);
  subiendo = signal(false);
  resultadoSubida = signal<{
    total: number;
    procesados: number;
    errores: number;
    resultados: Array<{
      archivo: string;
      estado: string;
      dni?: string;
      mensaje?: string;
      estudiante?: string;
    }>;
  } | null>(null);
  arrastrando = signal(false);

  // Subida individual
  modalIndividual = signal(false);
  estudianteSeleccionado = signal<EstudianteLibreta | null>(null);
  archivoIndividual: File | null = null;

  // Confirmación eliminar
  modalEliminar = signal(false);
  libretaAEliminar = signal<number | null>(null);

  // Computed: secciones filtradas por grado
  seccionesDelGrado = computed(() => {
    const idGrado = this.filtroGrado();
    if (!idGrado) return this.secciones();
    return this.secciones();
  });

  seccionesDelGradoSubida = computed(() => {
    const idGrado = this.gradoSubida();
    if (!idGrado) return this.secciones();
    return this.secciones();
  });

  // Computed: estudiantes filtrados por búsqueda
  estudiantesFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    if (!texto) return this.estudiantes();

    return this.estudiantes().filter(
      (e) =>
        `${e.nombres} ${e.apellidos}`.toLowerCase().includes(texto) ||
        e.dni.includes(texto),
    );
  });

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarLibretas();
  }

  cargarCatalogos(): void {
    this.http.get<Grado[]>(`${environment.apiUrl}/grado`).subscribe({
      next: (data) => this.grados.set(data),
      error: () => this.grados.set([]),
    });

    this.http.get<Seccion[]>(`${environment.apiUrl}/seccion`).subscribe({
      next: (data) => this.secciones.set(data),
      error: () => this.secciones.set([]),
    });

    this.http
      .get<Periodo[]>(`${environment.apiUrl}/periodo-academico`)
      .subscribe({
        next: (data) => this.periodos.set(data),
        error: () => this.periodos.set([]),
      });
  }

  // ===== Vistas =====

  mostrarLista(): void {
    this.vistaActual.set('lista');
    this.cargarLibretas();
  }

  mostrarSubida(): void {
    this.vistaActual.set('subida');
    this.gradoSubida.set(null);
    this.seccionSubida.set(null);
    this.periodoSubida.set(null);
    this.archivosSeleccionados.set([]);
    this.resultadoSubida.set(null);
    this.estudiantes.set([]);
  }

  // ===== Cargar libretas =====

  cargarLibretas(): void {
    this.cargando.set(true);
    this.error.set('');

    const params: Record<string, string> = {};
    if (this.filtroGrado()) params['id_grado'] = String(this.filtroGrado());
    if (this.filtroSeccion()) params['id_seccion'] = String(this.filtroSeccion());
    if (this.filtroPeriodo()) params['id_periodo'] = String(this.filtroPeriodo());

    this.http
      .get<Libreta[]>(`${environment.apiUrl}/libreta`, { params })
      .subscribe({
        next: (data) => {
          this.libretas.set(data);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.error.set('Error al cargar libretas');
        },
      });
  }

  onFiltroGradoChange(valor: string): void {
    this.filtroGrado.set(valor ? +valor : null);
    this.cargarLibretas();
  }

  onFiltroSeccionChange(valor: string): void {
    this.filtroSeccion.set(valor ? +valor : null);
    this.cargarLibretas();
  }

  onFiltroPeriodoChange(valor: string): void {
    this.filtroPeriodo.set(valor ? +valor : null);
    this.cargarLibretas();
  }

  limpiarFiltros(): void {
    this.filtroGrado.set(null);
    this.filtroSeccion.set(null);
    this.filtroPeriodo.set(null);
    this.busqueda.set('');
    this.cargarLibretas();
  }

  hayFiltrosActivos(): boolean {
    return (
      !!this.filtroGrado() ||
      !!this.filtroSeccion() ||
      !!this.filtroPeriodo() ||
      !!this.busqueda()
    );
  }

  // ===== Cargar estudiantes para subida =====

  cargarEstudiantes(): void {
    const idGrado = this.gradoSubida();
    const idSeccion = this.seccionSubida();
    const idPeriodo = this.periodoSubida();

    if (!idGrado || !idSeccion || !idPeriodo) {
      this.error.set('Debe seleccionar grado, sección y periodo');
      return;
    }

    this.cargando.set(true);
    this.error.set('');

    this.http
      .get<EstudianteLibreta[]>(
        `${environment.apiUrl}/libreta/estudiantes/${idGrado}/${idSeccion}/${idPeriodo}`,
      )
      .subscribe({
        next: (data) => {
          this.estudiantes.set(data);
          this.cargando.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.error.set('Error al cargar estudiantes');
        },
      });
  }

  // ===== Subida individual =====

  abrirModalIndividual(estudiante: EstudianteLibreta): void {
    this.estudianteSeleccionado.set(estudiante);
    this.archivoIndividual = null;
    this.error.set('');
    this.modalIndividual.set(true);
  }

  onArchivoIndividualChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivoIndividual = input.files[0];
    }
  }

  subirIndividual(): void {
    const estudiante = this.estudianteSeleccionado();
    if (!estudiante || !this.archivoIndividual) {
      this.error.set('Debe seleccionar un archivo PDF');
      return;
    }

    const idPeriodo = this.periodoSubida();
    if (!idPeriodo) {
      this.error.set('Debe seleccionar un periodo académico');
      return;
    }

    this.subiendo.set(true);
    const form = new FormData();
    form.append('id_estudiante', String(estudiante.id_estudiante));
    form.append('id_periodo', String(idPeriodo));
    form.append('archivo', this.archivoIndividual);

    this.http.post(`${environment.apiUrl}/libreta`, form).subscribe({
      next: () => {
        this.subiendo.set(false);
        this.modalIndividual.set(false);
        this.cargarEstudiantes();
      },
      error: () => {
        this.subiendo.set(false);
        this.error.set('Error al subir la libreta');
      },
    });
  }

  cerrarModalIndividual(): void {
    this.modalIndividual.set(false);
    this.estudianteSeleccionado.set(null);
    this.archivoIndividual = null;
  }

  // ===== Subida masiva =====

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.arrastrando.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.arrastrando.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.arrastrando.set(false);

    if (event.dataTransfer?.files) {
      this.procesarArchivos(Array.from(event.dataTransfer.files));
    }
  }

  onArchivosChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.procesarArchivos(Array.from(input.files));
    }
    input.value = '';
  }

  private procesarArchivos(files: File[]): void {
    const pdfs = files.filter((f) => f.type === 'application/pdf');
    if (pdfs.length === 0) {
      this.error.set('Solo se permiten archivos PDF');
      return;
    }

    // Emparejar con estudiantes por DNI
    const estudiantes = this.estudiantes();
    const nuevos = pdfs.map((file) => {
      const dniMatch = file.name.match(/(\d{8})/);
      const dni = dniMatch ? dniMatch[1] : null;
      const estudiante = dni
        ? estudiantes.find((e) => e.dni === dni)
        : undefined;
      return { file, estudiante };
    });

    this.archivosSeleccionados.update((prev) => [...prev, ...nuevos]);
    this.error.set('');
  }

  quitarArchivo(index: number): void {
    this.archivosSeleccionados.update((prev) => prev.filter((_, i) => i !== index));
  }

  subirMasiva(): void {
    const idGrado = this.gradoSubida();
    const idSeccion = this.seccionSubida();
    const idPeriodo = this.periodoSubida();
    const archivos = this.archivosSeleccionados();

    if (!idGrado || !idSeccion || !idPeriodo) {
      this.error.set('Debe seleccionar grado, sección y periodo');
      return;
    }

    if (archivos.length === 0) {
      this.error.set('Debe seleccionar al menos un archivo PDF');
      return;
    }

    this.subiendo.set(true);
    this.error.set('');
    this.resultadoSubida.set(null);

    const form = new FormData();
    form.append('id_grado', String(idGrado));
    form.append('id_seccion', String(idSeccion));
    form.append('id_periodo', String(idPeriodo));
    for (const item of archivos) {
      form.append('archivos', item.file);
    }

    this.http
      .post<{
        total: number;
        procesados: number;
        errores: number;
        resultados: Array<{
          archivo: string;
          estado: string;
          dni?: string;
          mensaje?: string;
          estudiante?: string;
        }>;
      }>(`${environment.apiUrl}/libreta/masiva`, form)
      .subscribe({
        next: (data) => {
          this.resultadoSubida.set(data);
          this.subiendo.set(false);
          // Recargar estudiantes
          this.cargarEstudiantes();
        },
        error: () => {
          this.subiendo.set(false);
          this.error.set('Error al subir las libretas');
        },
      });
  }

  // ===== Acciones =====

  verLibreta(id: number): void {
    window.open(`${environment.apiUrl}/libreta/${id}/ver`, '_blank');
  }

  descargarLibreta(id: number): void {
    window.open(`${environment.apiUrl}/libreta/${id}/descargar`, '_blank');
  }

  confirmarEliminar(id: number): void {
    this.libretaAEliminar.set(id);
    this.modalEliminar.set(true);
  }

  eliminarLibreta(): void {
    const id = this.libretaAEliminar();
    if (!id) return;

    this.http.delete(`${environment.apiUrl}/libreta/${id}`).subscribe({
      next: () => {
        this.modalEliminar.set(false);
        this.libretaAEliminar.set(null);
        this.cargarLibretas();
      },
      error: () => this.error.set('Error al eliminar la libreta'),
    });
  }

  cerrarModalEliminar(): void {
    this.modalEliminar.set(false);
    this.libretaAEliminar.set(null);
  }

  // ===== Utilidades =====

  formatearFecha(fecha: string): string {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  obtenerNombreEstudiante(libreta: Libreta): string {
    return `${libreta.estudiante.nombres} ${libreta.estudiante.apellidos}`;
  }

  contadorActivos(): string {
    const total = this.estudiantes().length;
    const conLibreta = this.estudiantes().filter((e) => e.tiene_libreta).length;
    return `${conLibreta}/${total} estudiantes con libreta`;
  }
}