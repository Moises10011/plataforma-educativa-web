import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface DocumentoInstitucional {
  id_documento: number;
  titulo: string;
  descripcion: string | null;
  archivo: string;
  fecha_subida: string;
}

interface Grado {
  id_grado: number;
  nombre: string;
}

interface Seccion {
  id_seccion: number;
  nombre: string;
}

interface Docente {
  id_usuario: number;
  nombres: string;
  apellidos: string;
}

interface DocumentoForm {
  titulo: string;
  descripcion: string;
  tipo: 'todos' | 'estudiantes' | 'docentes';
  id_grado: number | null;
  id_seccion: number | null;
  id_usuario: number | null;
}

const FORM_INICIAL: DocumentoForm = {
  titulo: '',
  descripcion: '',
  tipo: 'todos',
  id_grado: null,
  id_seccion: null,
  id_usuario: null,
};

@Component({
  selector: 'app-documentos-institucionales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './institucionales.html',
  styleUrl: './institucionales.css',
})
export class AdminInstitucionales implements OnInit {
  private readonly http = inject(HttpClient);

  // Catálogos
  grados = signal<Grado[]>([]);
  secciones = signal<Seccion[]>([]);
  docentes = signal<Docente[]>([]);

  // Pestaña activa
  pestanaActiva = signal<'todos' | 'estudiantes'>('todos');

  // Búsqueda
  busqueda = signal('');

  // Datos
  documentos = signal<DocumentoInstitucional[]>([]);
  cargando = signal(false);
  error = signal('');
  exito = signal('');

  // Modal nuevo/editar
  modalForm = signal(false);
  modalEliminar = signal(false);
  modalVer = signal(false);
  editando = signal(false);
  idEditando = signal<number | null>(null);
  form: DocumentoForm = { ...FORM_INICIAL };
  archivo: File | null = null;
  archivoNombre = '';
  guardando = signal(false);

  // Eliminar
  idAEliminar = signal<number | null>(null);

  // Vista de documento
  documentoSeleccionado = signal<DocumentoInstitucional | null>(null);

  // Documentos filtrados
  documentosFiltrados = computed(() => {
    const tipo = this.pestanaActiva();
    const texto = this.busqueda().trim().toLowerCase();

    let filtrados = this.documentos();

    // Filtrar por tipo
    if (tipo === 'estudiantes') {
      filtrados = filtrados.filter((d) =>
        (d.descripcion ?? '').toLowerCase().includes('estudiante'),
      );
    }

    // Filtrar por búsqueda
    if (texto) {
      filtrados = filtrados.filter((d) =>
        d.titulo.toLowerCase().includes(texto) ||
        d.descripcion?.toLowerCase().includes(texto)
      );
    }

    return filtrados;
  });

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarDocumentos();
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

    this.http.get<Docente[]>(`${environment.apiUrl}/usuario/docentes`).subscribe({
      next: (data) => this.docentes.set(data),
      error: () => this.docentes.set([]),
    });
  }

  cargarDocumentos(): void {
    this.cargando.set(true);
    this.error.set('');

    this.http
      .get<DocumentoInstitucional[]>(`${environment.apiUrl}/documento-institucional`)
      .subscribe({
        next: (data) => {
          this.documentos.set(data);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.cargando.set(false);
          this.error.set('Error al cargar documentos');
        },
      });
  }

  cambiarPestana(tipo: 'todos' | 'estudiantes'): void {
    this.pestanaActiva.set(tipo);
    this.busqueda.set('');
  }

  // ===== Modal Nuevo/Editar =====

  abrirModalNuevo(): void {
    this.editando.set(false);
    this.idEditando.set(null);
    this.form = { ...FORM_INICIAL };
    this.archivo = null;
    this.archivoNombre = '';
    this.error.set('');
    this.modalForm.set(true);
  }

  abrirModalEditar(documento: DocumentoInstitucional): void {
    this.editando.set(true);
    this.idEditando.set(documento.id_documento);
    this.form = {
      titulo: documento.titulo,
      descripcion: documento.descripcion || '',
      tipo: 'todos',
      id_grado: null,
      id_seccion: null,
      id_usuario: null,
    };
    this.archivo = null;
    this.archivoNombre = '';
    this.error.set('');
    this.modalForm.set(true);
  }

  onArchivoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';

    if (file) {
      const extension = file.name.toLowerCase();
      if (!extension.endsWith('.pdf') && !extension.endsWith('.doc') && !extension.endsWith('.docx')) {
        this.error.set('Solo se permiten archivos PDF, DOC o DOCX');
        return;
      }
    }

    this.archivo = file;
    this.archivoNombre = file?.name ?? '';
  }

  quitarArchivo(): void {
    this.archivo = null;
    this.archivoNombre = '';
  }

  guardar(): void {
    if (!this.form.titulo.trim()) {
      this.error.set('El título es obligatorio');
      return;
    }

    if (this.form.tipo === 'estudiantes' && !this.form.id_grado) {
      this.error.set('Debe seleccionar un grado');
      return;
    }

    if (!this.editando() && this.form.tipo === 'docentes' && !this.form.id_usuario) {
      this.error.set('Debe seleccionar un docente');
      return;
    }

    if (!this.editando() && !this.archivo) {
      this.error.set('Debe seleccionar un archivo');
      return;
    }

    this.guardando.set(true);
    this.error.set('');

    const formData = new FormData();
    formData.append('titulo', this.form.titulo.trim());
    formData.append('descripcion', this.form.descripcion.trim());
    if (!this.editando()) {
      formData.append('tipo', this.form.tipo);

      if (this.form.tipo === 'estudiantes' && this.form.id_grado) {
        formData.append('id_grado', String(this.form.id_grado));
      }

      if (this.form.tipo === 'estudiantes' && this.form.id_seccion) {
        formData.append('id_seccion', String(this.form.id_seccion));
      }

      if (this.form.tipo === 'docentes' && this.form.id_usuario) {
        formData.append('id_usuario', String(this.form.id_usuario));
      }
    }

    if (this.archivo) {
      formData.append('archivo', this.archivo);
    }

    if (this.editando() && this.idEditando()) {
      // Actualizar
      this.http
        .patch(`${environment.apiUrl}/documento-institucional/${this.idEditando()}`, formData)
        .subscribe({
          next: () => {
            this.guardando.set(false);
            this.cerrarModal();
            this.exito.set('Documento actualizado correctamente');
            this.cargarDocumentos();
            setTimeout(() => this.exito.set(''), 3000);
          },
          error: (err: HttpErrorResponse) => {
            this.guardando.set(false);
            this.error.set(err.error?.message || 'Error al actualizar el documento');
          },
        });
    } else {
      // Crear
      this.http
        .post<DocumentoInstitucional>(`${environment.apiUrl}/documento-institucional`, formData)
        .subscribe({
          next: (documentoCreado) => {
            this.guardando.set(false);
            this.cerrarModal();
            this.exito.set('Documento subido correctamente');
            this.cargarDocumentos();
            setTimeout(() => this.exito.set(''), 3000);
          },
          error: (err: HttpErrorResponse) => {
            this.guardando.set(false);
            this.error.set(err.error?.message || 'Error al subir el documento');
          },
        });
    }
  }

  cerrarModal(): void {
    this.modalForm.set(false);
    this.modalEliminar.set(false);
    this.modalVer.set(false);
    this.idEditando.set(null);
    this.archivo = null;
    this.archivoNombre = '';
  }

  // ===== Eliminar =====

  confirmarEliminar(id: number): void {
    this.idAEliminar.set(id);
    this.modalEliminar.set(true);
  }

  eliminar(): void {
    const id = this.idAEliminar();
    if (!id) return;

    this.http.delete(`${environment.apiUrl}/documento-institucional/${id}`).subscribe({
      next: () => {
        this.modalEliminar.set(false);
        this.idAEliminar.set(null);
        this.exito.set('Documento eliminado correctamente');
        this.cargarDocumentos();
        setTimeout(() => this.exito.set(''), 3000);
      },
      error: () => {
        this.error.set('Error al eliminar el documento');
        this.modalEliminar.set(false);
      },
    });
  }

  cerrarModalEliminar(): void {
    this.modalEliminar.set(false);
    this.idAEliminar.set(null);
  }

  // ===== Acciones =====

  verDocumento(documento: DocumentoInstitucional): void {
    this.documentoSeleccionado.set(documento);
    this.modalVer.set(true);
  }

  descargarDocumento(documento: DocumentoInstitucional): void {
    window.open(`${environment.apiUrl}/documento-institucional/${documento.id_documento}/descargar`, '_blank');
  }

  seleccionarDocumento(documento: DocumentoInstitucional): void {
    if (this.documentoSeleccionado()?.id_documento === documento.id_documento) {
      this.documentoSeleccionado.set(null);
    } else {
      this.documentoSeleccionado.set(documento);
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

  esPdf(archivo: string): boolean {
    return archivo.toLowerCase().endsWith('.pdf');
  }

  limpiarError(): void {
    this.error.set('');
  }

  limpiarExito(): void {
    this.exito.set('');
  }
}