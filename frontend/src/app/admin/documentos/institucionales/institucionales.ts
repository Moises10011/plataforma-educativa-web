import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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

type TipoDestinatario = 'todos' | 'estudiantes' | 'docentes';

interface NuevoDocumento {
  titulo: string;
  descripcion: string;
  tipo: TipoDestinatario;
  id_grado: number | null;
  id_seccion: number | null;
  id_usuario: number | null;
}

@Component({
  selector: 'app-documentos-institucionales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './institucionales.html',
  styleUrl: './institucionales.css',
})
export class AdminInstitucionales implements OnInit {
  private readonly http = inject(HttpClient);

  documentos = signal<DocumentoInstitucional[]>([]);
  cargando = signal(true);

  modalSubir = signal(false);
  modalEliminar = signal(false);
  private idAEliminar = signal<number | null>(null);

  guardando = signal(false);
  error = signal<string | null>(null);
  private archivo: File | null = null;
  archivoNombre = '';

  nuevo: NuevoDocumento = this.formularioVacio();

  grados = signal<Grado[]>([]);
  secciones = signal<Seccion[]>([]);
  docentes = signal<Docente[]>([]);

  puedeGuardar = computed(() => {
    if (!this.nuevo.titulo.trim() || !this.archivo) return false;
    if (this.nuevo.tipo === 'estudiantes' && !this.nuevo.id_grado) return false;
    return true;
  });

  ngOnInit(): void {
    this.cargarDocumentos();
    this.cargarGrados();
    this.cargarSecciones();
    this.cargarDocentes();
  }

  private cargarDocumentos(): void {
    this.cargando.set(true);
    this.http.get<DocumentoInstitucional[]>('/api/documento-institucional').subscribe({
      next: (data) => {
        this.documentos.set(data);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los documentos.');
        this.cargando.set(false);
      },
    });
  }

  private cargarGrados(): void {
    this.http.get<Grado[]>('/api/grado').subscribe({
      next: (data) => this.grados.set(data),
    });
  }

  private cargarSecciones(): void {
    this.http.get<Seccion[]>('/api/seccion').subscribe({
      next: (data) => this.secciones.set(data),
    });
  }

  private cargarDocentes(): void {
    this.http.get<Docente[]>('/api/usuario?rol=docente').subscribe({
      next: (data) => this.docentes.set(data),
    });
  }

  esPdf(archivo: string): boolean {
    return archivo.toLowerCase().endsWith('.pdf');
  }

  trackByDocumento(_: number, d: DocumentoInstitucional): number {
    return d.id_documento;
  }

  trackByGrado(_: number, g: Grado): number {
    return g.id_grado;
  }

  trackBySeccion(_: number, s: Seccion): number {
    return s.id_seccion;
  }

  trackByDocente(_: number, doc: Docente): number {
    return doc.id_usuario;
  }

  abrirModal(): void {
    this.nuevo = this.formularioVacio();
    this.archivo = null;
    this.archivoNombre = '';
    this.error.set(null);
    this.modalSubir.set(true);
  }

  cerrarModal(): void {
    this.modalSubir.set(false);
    this.modalEliminar.set(false);
    this.idAEliminar.set(null);
  }

  onArchivoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (file && !this.esExtensionPermitida(file)) {
      this.error.set('Solo se permiten archivos .pdf, .doc o .docx.');
      input.value = '';
      this.archivo = null;
      this.archivoNombre = '';
      return;
    }

    this.archivo = file;
    this.archivoNombre = file?.name ?? '';
  }

  private esExtensionPermitida(file: File): boolean {
    return /\.(pdf|docx?|PDF|DOCX?)$/.test(file.name);
  }

  onTipoChange(): void {
    this.nuevo.id_grado = null;
    this.nuevo.id_seccion = null;
    this.nuevo.id_usuario = null;
  }

  guardar(): void {
    if (!this.puedeGuardar() || !this.archivo) return;

    this.guardando.set(true);
    this.error.set(null);

    const formData = new FormData();
    formData.append('titulo', this.nuevo.titulo.trim());
    formData.append('descripcion', this.nuevo.descripcion.trim());
    formData.append('tipo', this.nuevo.tipo);
    formData.append('archivo', this.archivo);

    if (this.nuevo.tipo === 'estudiantes' && this.nuevo.id_grado) {
      formData.append('id_grado', String(this.nuevo.id_grado));
    }
    if (this.nuevo.tipo === 'estudiantes' && this.nuevo.id_seccion) {
      formData.append('id_seccion', String(this.nuevo.id_seccion));
    }
    if (this.nuevo.tipo === 'docentes' && this.nuevo.id_usuario) {
      formData.append('id_usuario', String(this.nuevo.id_usuario));
    }

    this.http.post<DocumentoInstitucional>('/api/documento-institucional', formData).subscribe({
      next: (documentoCreado) => {
        this.documentos.update((lista) => [documentoCreado, ...lista]);
        this.guardando.set(false);
        this.cerrarModal();
      },
      error: () => {
        this.error.set('Ocurrió un error al subir el documento.');
        this.guardando.set(false);
      },
    });
  }

  confirmarEliminar(id: number): void {
    this.idAEliminar.set(id);
    this.modalEliminar.set(true);
  }

  eliminar(): void {
    const id = this.idAEliminar();
    if (id === null) return;

    this.http.delete(`/api/documento-institucional/${id}`).subscribe({
      next: () => {
        this.documentos.update((lista) => lista.filter((d) => d.id_documento !== id));
        this.cerrarModal();
      },
      error: () => {
        this.error.set('No se pudo eliminar el documento.');
        this.cerrarModal();
      },
    });
  }

  descargar(documento: DocumentoInstitucional): void {
    window.open(`/api/documento-institucional/${documento.id_documento}/descargar`, '_blank');
  }

  private formularioVacio(): NuevoDocumento {
    return {
      titulo: '',
      descripcion: '',
      tipo: 'todos',
      id_grado: null,
      id_seccion: null,
      id_usuario: null,
    };
  }
}