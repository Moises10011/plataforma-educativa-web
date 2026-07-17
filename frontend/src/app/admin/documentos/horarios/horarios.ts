import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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

interface Docente {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
}

interface Horario {
  id_horario: number;
  tipo: 'estudiante' | 'docente';
  id_grado: number | null;
  id_seccion: number | null;
  id_periodo: number;
  id_usuario_docente: number | null;
  archivo: string;
  descripcion?: string;
  fecha_subida: string;
  grado: { nombre: string } | null;
  seccion: { nombre: string } | null;
  periodo: { nombre: string };
  docente: { nombres: string; apellidos: string } | null;
}

interface HorarioForm {
  tipo: 'estudiante' | 'docente';
  id_grado: number | null;
  id_seccion: number | null;
  id_periodo: number | null;
  id_usuario_docente: number | null;
  descripcion: string;
}

const FORM_INICIAL: HorarioForm = {
  tipo: 'estudiante',
  id_grado: null,
  id_seccion: null,
  id_periodo: null,
  id_usuario_docente: null,
  descripcion: '',
};

const MAX_ARCHIVOS = 50;

@Component({
  selector: 'app-admin-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horarios.html',
  styleUrl: './horarios.css',
})
export class AdminHorarios implements OnInit {
  // Catálogos
  grados = signal<Grado[]>([]);
  secciones = signal<Seccion[]>([]);
  periodos = signal<Periodo[]>([]);
  docentes = signal<Docente[]>([]);

  // Pestaña activa
  pestanaActiva = signal<'estudiante' | 'docente'>('estudiante');

  // Filtros estudiantes
  filtroGrado = signal<number | null>(null);
  filtroSeccion = signal<number | null>(null);
  filtroPeriodoEstudiante = signal<number | null>(null);

  // Filtros docentes
  filtroDocente = signal<number | null>(null);
  filtroPeriodoDocente = signal<number | null>(null);

  // Búsqueda general
  busqueda = signal('');

  // Datos
  horarios = signal<Horario[]>([]);
  cargando = signal(false);
  error = signal('');
  exito = signal('');

  // Modal nuevo/editar
  modalForm = signal(false);
  modalEliminar = signal(false);
  editando = signal(false);
  idEditando = signal<number | null>(null);
  form: HorarioForm = { ...FORM_INICIAL };
  archivosSeleccionados: File[] = [];

  idAEliminar = signal<number | null>(null);
  guardando = signal(false);

  // Búsqueda de docentes en modal
  busquedaDocente = signal('');
  docentesFiltrados = computed(() => {
    const texto = this.busquedaDocente().trim().toLowerCase();
    if (!texto) return this.docentes();
    return this.docentes().filter((d) =>
      d.nombre_completo.toLowerCase().includes(texto),
    );
  });

  // Vista de detalle
  horarioSeleccionado = signal<Horario | null>(null);

  seccionesDelGrado = computed(() => {
    const idGrado = this.filtroGrado();
    if (!idGrado) return this.secciones();
    return this.secciones();
  });

  horariosFiltrados = computed(() => {
    const tipo = this.pestanaActiva();
    const texto = this.busqueda().trim().toLowerCase();

    let filtrados = this.horarios().filter((h) => h.tipo === tipo);

    // Aplicar filtros específicos por tipo
    if (tipo === 'estudiante') {
      if (this.filtroGrado()) {
        filtrados = filtrados.filter((h) => h.id_grado === this.filtroGrado());
      }
      if (this.filtroSeccion()) {
        filtrados = filtrados.filter((h) => h.id_seccion === this.filtroSeccion());
      }
      if (this.filtroPeriodoEstudiante()) {
        filtrados = filtrados.filter((h) => h.id_periodo === this.filtroPeriodoEstudiante());
      }
    } else {
      if (this.filtroDocente()) {
        filtrados = filtrados.filter((h) => h.id_usuario_docente === this.filtroDocente());
      }
      if (this.filtroPeriodoDocente()) {
        filtrados = filtrados.filter((h) => h.id_periodo === this.filtroPeriodoDocente());
      }
    }

    // Aplicar búsqueda de texto
    if (texto) {
      filtrados = filtrados.filter((h) => {
        const gradoNombre = h.grado?.nombre || '';
        const seccionNombre = h.seccion?.nombre || '';
        const periodoNombre = h.periodo.nombre;
        const docenteNombre = h.docente
          ? `${h.docente.nombres} ${h.docente.apellidos}`
          : '';
        const descripcion = h.descripcion || '';

        return (
          gradoNombre.toLowerCase().includes(texto) ||
          seccionNombre.toLowerCase().includes(texto) ||
          periodoNombre.toLowerCase().includes(texto) ||
          docenteNombre.toLowerCase().includes(texto) ||
          descripcion.toLowerCase().includes(texto)
        );
      });
    }

    return filtrados;
  });

  hayFiltrosActivos(): boolean {
    const tipo = this.pestanaActiva();
    if (tipo === 'estudiante') {
      return (
        !!this.filtroGrado() ||
        !!this.filtroSeccion() ||
        !!this.filtroPeriodoEstudiante() ||
        !!this.busqueda()
      );
    } else {
      return (
        !!this.filtroDocente() ||
        !!this.filtroPeriodoDocente() ||
        !!this.busqueda()
      );
    }
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarHorarios();
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

    this.http.get<Docente[]>(`${environment.apiUrl}/horario/docentes`).subscribe({
      next: (data) => this.docentes.set(data),
      error: () => this.docentes.set([]),
    });
  }

  cargarHorarios(): void {
    this.cargando.set(true);
    this.error.set('');

    const tipo = this.pestanaActiva();
    const params: Record<string, string> = {
      tipo: tipo,
    };

    if (tipo === 'estudiante') {
      if (this.filtroGrado()) params['id_grado'] = String(this.filtroGrado());
      if (this.filtroSeccion())
        params['id_seccion'] = String(this.filtroSeccion());
      if (this.filtroPeriodoEstudiante())
        params['id_periodo'] = String(this.filtroPeriodoEstudiante());
    } else {
      if (this.filtroDocente()) params['id_usuario'] = String(this.filtroDocente());
      if (this.filtroPeriodoDocente())
        params['id_periodo'] = String(this.filtroPeriodoDocente());
    }

    this.http
      .get<Horario[]>(`${environment.apiUrl}/horario`, { params })
      .subscribe({
        next: (data) => {
          this.horarios.set(data);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.cargando.set(false);
          if (err.status !== 404 && err.status !== 0 && err.status !== 500) {
            this.error.set('Error al cargar horarios');
          }
        },
      });
  }

  cambiarPestana(tipo: 'estudiante' | 'docente'): void {
    this.pestanaActiva.set(tipo);
    this.limpiarFiltros();
  }

  onFiltroGradoChange(valor: string): void {
    this.filtroGrado.set(valor ? +valor : null);
    this.filtroSeccion.set(null);
    this.cargarHorarios();
  }

  onFiltroSeccionChange(valor: string): void {
    this.filtroSeccion.set(valor ? +valor : null);
    this.cargarHorarios();
  }

  onFiltroPeriodoEstudianteChange(valor: string): void {
    this.filtroPeriodoEstudiante.set(valor ? +valor : null);
    this.cargarHorarios();
  }

  onFiltroDocenteChange(valor: string): void {
    this.filtroDocente.set(valor ? +valor : null);
    this.cargarHorarios();
  }

  onFiltroPeriodoDocenteChange(valor: string): void {
    this.filtroPeriodoDocente.set(valor ? +valor : null);
    this.cargarHorarios();
  }

  limpiarFiltros(): void {
    this.filtroGrado.set(null);
    this.filtroSeccion.set(null);
    this.filtroPeriodoEstudiante.set(null);
    this.filtroDocente.set(null);
    this.filtroPeriodoDocente.set(null);
    this.busqueda.set('');
    this.cargarHorarios();
  }

  // ===== Modal nuevo =====

  abrirModalNuevo(): void {
    this.editando.set(false);
    this.idEditando.set(null);
    this.form = { ...FORM_INICIAL };
    this.archivosSeleccionados = [];
    this.error.set('');
    this.busquedaDocente.set('');
    this.modalForm.set(true);
  }

  abrirModalEditar(horario: Horario): void {
    this.editando.set(true);
    this.idEditando.set(horario.id_horario);
    this.form = {
      tipo: horario.tipo,
      id_grado: horario.id_grado,
      id_seccion: horario.id_seccion,
      id_periodo: horario.id_periodo,
      id_usuario_docente: horario.id_usuario_docente,
      descripcion: horario.descripcion || '',
    };
    this.archivosSeleccionados = [];
    this.error.set('');
    this.busquedaDocente.set('');
    this.modalForm.set(true);
  }

  onArchivosChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const nuevos = Array.from(input.files ?? []);
    input.value = '';

    const disponibles = MAX_ARCHIVOS - this.archivosSeleccionados.length;
    if (disponibles <= 0) {
      this.error.set(`Máximo ${MAX_ARCHIVOS} archivos`);
      return;
    }

    this.archivosSeleccionados = [
      ...this.archivosSeleccionados,
      ...nuevos.slice(0, disponibles),
    ];
  }

  quitarArchivo(index: number): void {
    this.archivosSeleccionados = this.archivosSeleccionados.filter(
      (_, i) => i !== index,
    );
  }
  dropdownDocenteAbierto = signal(false);

  abrirDropdownDocente(): void {
    this.dropdownDocenteAbierto.set(true);
  }

  cerrarDropdownDocente(): void {
    setTimeout(() => this.dropdownDocenteAbierto.set(false), 150);
  }

  seleccionarDocente(docente: Docente): void {
    this.form.id_usuario_docente = docente.id_usuario;
    this.busquedaDocente.set(docente.nombre_completo);
    this.dropdownDocenteAbierto.set(false);
  }

  nombreDocenteSeleccionado(): string {
    const docente = this.docentes().find(
      (d) => d.id_usuario === this.form.id_usuario_docente,
    );
    return docente?.nombre_completo ?? '';
  }

  quitarDocenteSeleccionado(): void {
    this.form.id_usuario_docente = null;
    this.busquedaDocente.set('');
  }

  guardar(): void {
    const tipo = this.form.tipo;

    // Validaciones según el tipo
    if (tipo === 'estudiante') {
      if (!this.form.id_grado || !this.form.id_seccion || !this.form.id_periodo) {
        this.error.set('Debe seleccionar grado, sección y periodo');
        return;
      }
    } else {
      if (!this.form.id_usuario_docente || !this.form.id_periodo) {
        this.error.set('Debe seleccionar un docente y un periodo');
        return;
      }
    }

    if (!this.editando() && this.archivosSeleccionados.length === 0) {
      this.error.set('Debe seleccionar al menos un archivo');
      return;
    }

    this.guardando.set(true);
    this.error.set('');

    const formData = new FormData();
    formData.append('tipo', tipo);
    formData.append('id_periodo', String(this.form.id_periodo));
    if (this.form.descripcion) {
      formData.append('descripcion', this.form.descripcion);
    }

    if (tipo === 'estudiante') {
      formData.append('id_grado', String(this.form.id_grado!));
      formData.append('id_seccion', String(this.form.id_seccion!));
    } else {
      formData.append('id_usuario_docente', String(this.form.id_usuario_docente!));
    }

    for (const file of this.archivosSeleccionados) {
      formData.append('archivos', file);
    }

    if (this.editando() && this.idEditando()) {
      this.http
        .put(`${environment.apiUrl}/horario/${this.idEditando()}`, formData)
        .subscribe({
          next: () => {
            this.guardando.set(false);
            this.cerrarModal();
            this.mostrarExito('Horario actualizado correctamente');
            this.cargarHorarios();
          },
          error: (err: HttpErrorResponse) => {
            this.guardando.set(false);
            this.error.set(err.error?.message || 'Error al actualizar el horario');
          },
        });
    } else {
      this.http.post(`${environment.apiUrl}/horario`, formData).subscribe({
        next: (data) => {
          this.guardando.set(false);
          this.cerrarModal();
          const cantidad = Array.isArray(data) ? data.length : 1;
          this.mostrarExito(`${cantidad} horario(s) subido(s) correctamente`);
          this.cargarHorarios();
        },
        error: (err: HttpErrorResponse) => {
          this.guardando.set(false);
          this.error.set(err.error?.message || 'Error al subir los horarios');
        },
      });
    }
  }

  cerrarModal(): void {
    this.modalForm.set(false);
    this.modalEliminar.set(false);
    this.idEditando.set(null);
    this.archivosSeleccionados = [];
    this.busquedaDocente.set('');
  }

  // ===== Eliminar =====

  idHorarioAEliminar = signal<number | null>(null);

  confirmarEliminar(id: number): void {
    this.idHorarioAEliminar.set(id);
    this.modalEliminar.set(true);
  }

  eliminarHorario(): void {
    const id = this.idHorarioAEliminar();
    if (!id) return;

    this.http.delete(`${environment.apiUrl}/horario/${id}`).subscribe({
      next: () => {
        this.modalEliminar.set(false);
        this.idHorarioAEliminar.set(null);
        this.mostrarExito('Horario eliminado correctamente');
        this.cargarHorarios();
      },
      error: () => this.error.set('Error al eliminar el horario'),
    });
  }

  cerrarModalEliminar(): void {
    this.modalEliminar.set(false);
    this.idHorarioAEliminar.set(null);
  }

  // ===== Acciones =====

  verHorario(id: number): void {
    this.http.get(`${environment.apiUrl}/horario/${id}/ver`, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          window.open(url, '_blank');
        },
        error: () => this.error.set('Error al abrir el horario'),
      });
  }

  descargarHorario(id: number): void {
    this.http.get(`${environment.apiUrl}/horario/${id}/descargar`, { responseType: 'blob' })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = ''; // el backend ya manda el nombre en Content-Disposition
          a.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => this.error.set('Error al descargar el horario'),
      });
  }

  seleccionarHorario(horario: Horario): void {
    if (this.horarioSeleccionado()?.id_horario === horario.id_horario) {
      this.horarioSeleccionado.set(null);
    } else {
      this.horarioSeleccionado.set(horario);
    }
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

  limpiarExito(): void {
    this.exito.set('');
  }
  mostrarExito(mensaje: string): void {
    this.exito.set(mensaje);
    setTimeout(() => {
      if (this.exito() === mensaje) {
        this.exito.set('');
      }
    }, 3000);
  }
  limpiarError(): void {
    this.error.set('');
  }
}