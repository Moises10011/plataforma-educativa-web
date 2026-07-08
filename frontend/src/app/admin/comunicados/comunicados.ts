import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type TipoDestinatario = 'todos' | 'estudiantes' | 'docentes';
export type CategoriaArchivo = 'pdf' | 'word' | 'excel' | 'imagen' | 'otro';

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

interface Destinatario {
  id?: number;
  tipo: TipoDestinatario;
  id_grado?: number | null;
  id_seccion?: number | null;
  id_usuario?: number | null;
  grado?: Grado | null;
  seccion?: Seccion | null;
  usuario?: Docente | null;
}

interface Adjunto {
  id: number;
  nombre_original: string;
  mime_type: string;
  tamano: number;
}

interface Comunicado {
  id_comunicado: number;
  titulo: string;
  contenido: string;
  archivo?: string;
  adjuntos?: Adjunto[];
  fecha_publicacion: string;
  autor?: { nombres: string; apellidos: string };
  destinatarios: Destinatario[];
}

interface ComunicadoForm {
  titulo: string;
  contenido: string;
  tipo: TipoDestinatario;
  id_usuarios: number[];
  id_grados: number[];
  id_secciones: number[];
}

const FORM_INICIAL: ComunicadoForm = {
  titulo: '',
  contenido: '',
  tipo: 'todos',
  id_usuarios: [],
  id_grados: [],
  id_secciones: [],
};

const MAX_ARCHIVOS = 10;

interface ArchivoConPreview {
  file: File;
  previewUrl: string | null;
}

@Component({
  selector: 'app-admin-comunicados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comunicados.html',
  styleUrl: './comunicados.css',
})
export class AdminComunicados implements OnInit {
  comunicados = signal<Comunicado[]>([]);
  grados = signal<Grado[]>([]);
  secciones = signal<Seccion[]>([]);
  docentes = signal<Docente[]>([]);

  cargando = signal(true);
  guardando = signal(false);
  error = signal('');

  modalNuevo = signal(false);
  modalEditar = signal(false);
  modalEliminar = signal(false);
  idAEliminar = signal<number | null>(null);
  idEditando = signal<number | null>(null);
  adjuntosEditando = signal<Adjunto[]>([]);

  nuevo: ComunicadoForm = { ...FORM_INICIAL, id_usuarios: [], id_grados: [], id_secciones: [] };
  editar: ComunicadoForm = { ...FORM_INICIAL, id_usuarios: [], id_grados: [], id_secciones: [] };
  archivosSeleccionados: ArchivoConPreview[] = [];

  filtroTipo = signal<TipoDestinatario | 'TODOS_TIPOS'>('TODOS_TIPOS');
  filtroGrado = signal<number | null>(null);
  filtroSeccion = signal<number | null>(null);
  filtroDocente = signal<number | null>(null);
  busqueda = signal('');

  seccionesDelFiltro = computed(() => this.secciones());

  comunicadosFiltrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    if (!texto) return this.comunicados();
    return this.comunicados().filter(
      (c) =>
        c.titulo.toLowerCase().includes(texto) ||
        c.contenido.toLowerCase().includes(texto),
    );
  });

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargar();
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
      .get<Docente[]>(`${environment.apiUrl}/usuario/docentes`)
      .subscribe({
        next: (data) => this.docentes.set(data),
        error: () => this.docentes.set([]),
      });
  }

  cargar(): void {
    this.cargando.set(true);

    const params: Record<string, string> = {};
    const tipo = this.filtroTipo();
    if (tipo !== 'TODOS_TIPOS') params['tipo'] = tipo;
    if (this.filtroGrado()) params['id_grado'] = String(this.filtroGrado());
    if (this.filtroSeccion()) params['id_seccion'] = String(this.filtroSeccion());
    if (this.filtroDocente()) params['id_usuario'] = String(this.filtroDocente());

    this.http
      .get<Comunicado[]>(`${environment.apiUrl}/comunicado`, { params })
      .subscribe({
        next: (data) => {
          this.comunicados.set(data);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
  }

  cambiarFiltroTipo(tipo: TipoDestinatario | 'TODOS_TIPOS'): void {
    this.filtroTipo.set(tipo);
    if (tipo !== 'estudiantes') {
      this.filtroGrado.set(null);
      this.filtroSeccion.set(null);
    }
    if (tipo !== 'docentes') {
      this.filtroDocente.set(null);
    }
    this.cargar();
  }

  onFiltroGradoChange(valor: string): void {
    this.filtroGrado.set(valor ? +valor : null);
    this.filtroSeccion.set(null);
    this.cargar();
  }

  onFiltroSeccionChange(valor: string): void {
    this.filtroSeccion.set(valor ? +valor : null);
    this.cargar();
  }

  onFiltroDocenteChange(valor: string): void {
    this.filtroDocente.set(valor ? +valor : null);
    this.cargar();
  }

  limpiarFiltros(): void {
    this.filtroTipo.set('TODOS_TIPOS');
    this.filtroGrado.set(null);
    this.filtroSeccion.set(null);
    this.filtroDocente.set(null);
    this.busqueda.set('');
    this.cargar();
  }

  hayFiltrosActivos(): boolean {
    return (
      this.filtroTipo() !== 'TODOS_TIPOS' ||
      !!this.filtroGrado() ||
      !!this.filtroSeccion() ||
      !!this.filtroDocente() ||
      !!this.busqueda()
    );
  }

  // ===== Modal Nuevo =====

  abrirModal(): void {
    this.nuevo = { ...FORM_INICIAL, id_usuarios: [], id_grados: [], id_secciones: [] };
    this.limpiarArchivos();
    this.error.set('');
    this.modalNuevo.set(true);
  }

  onCambiarAudiencia(tipo: TipoDestinatario): void {
    this.nuevo.tipo = tipo;
    this.nuevo.id_usuarios = [];
    this.nuevo.id_grados = [];
    this.nuevo.id_secciones = [];
  }

  toggleDocente(id: number): void {
    const actuales = this.nuevo.id_usuarios;
    this.nuevo.id_usuarios = actuales.includes(id)
      ? actuales.filter((d) => d !== id)
      : [...actuales, id];
  }

  docenteSeleccionado(id: number): boolean {
    return this.nuevo.id_usuarios.includes(id);
  }

  toggleGrado(id: number): void {
    const actuales = this.nuevo.id_grados;
    this.nuevo.id_grados = actuales.includes(id)
      ? actuales.filter((g) => g !== id)
      : [...actuales, id];
  }

  gradoSeleccionado(id: number): boolean {
    return this.nuevo.id_grados.includes(id);
  }

  quitarGrado(id: number): void {
    this.nuevo.id_grados = this.nuevo.id_grados.filter((g) => g !== id);
  }

  toggleSeccion(id: number): void {
    const actuales = this.nuevo.id_secciones;
    this.nuevo.id_secciones = actuales.includes(id)
      ? actuales.filter((s) => s !== id)
      : [...actuales, id];
  }

  seccionSeleccionada(id: number): boolean {
    return this.nuevo.id_secciones.includes(id);
  }

  quitarSeccion(id: number): void {
    this.nuevo.id_secciones = this.nuevo.id_secciones.filter((s) => s !== id);
  }

  guardar(): void {
    if (!this.nuevo.titulo || !this.nuevo.contenido) {
      this.error.set('El título y contenido son obligatorios');
      return;
    }

    const destinatarios = this.construirDestinatarios(this.nuevo);

    this.guardando.set(true);
    const form = new FormData();
    form.append('titulo', this.nuevo.titulo);
    form.append('contenido', this.nuevo.contenido);
    form.append('destinatarios', JSON.stringify(destinatarios));
    for (const item of this.archivosSeleccionados) {
      form.append('archivos', item.file);
    }

    this.http.post(`${environment.apiUrl}/comunicado`, form).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargar();
      },
      error: () => {
        this.guardando.set(false);
        this.error.set('Error al publicar el comunicado');
      },
    });
  }

  // ===== Modal Editar =====

  abrirModalEditar(c: Comunicado): void {
    this.idEditando.set(c.id_comunicado);

    const destinatarios = c.destinatarios ?? [];
    const tipo: TipoDestinatario = destinatarios[0]?.tipo ?? 'todos';

    this.editar = {
      titulo: c.titulo,
      contenido: c.contenido,
      tipo,
      id_usuarios:
        tipo === 'docentes'
          ? destinatarios.filter((d) => d.id_usuario).map((d) => d.id_usuario!)
          : [],
      id_grados:
        tipo === 'estudiantes'
          ? [...new Set(destinatarios.filter((d) => d.id_grado).map((d) => d.id_grado!))]
          : [],
      id_secciones:
        tipo === 'estudiantes'
          ? [...new Set(destinatarios.filter((d) => d.id_seccion).map((d) => d.id_seccion!))]
          : [],
    };

    this.adjuntosEditando.set(c.adjuntos ?? []);
    this.limpiarArchivos();
    this.error.set('');
    this.modalEditar.set(true);
  }

  onCambiarAudienciaEditar(tipo: TipoDestinatario): void {
    this.editar.tipo = tipo;
    this.editar.id_usuarios = [];
    this.editar.id_grados = [];
    this.editar.id_secciones = [];
  }

  toggleDocenteEditar(id: number): void {
    const actuales = this.editar.id_usuarios;
    this.editar.id_usuarios = actuales.includes(id)
      ? actuales.filter((d) => d !== id)
      : [...actuales, id];
  }

  docenteSeleccionadoEditar(id: number): boolean {
    return this.editar.id_usuarios.includes(id);
  }

  toggleGradoEditar(id: number): void {
    const actuales = this.editar.id_grados;
    this.editar.id_grados = actuales.includes(id)
      ? actuales.filter((g) => g !== id)
      : [...actuales, id];
  }

  gradoSeleccionadoEditar(id: number): boolean {
    return this.editar.id_grados.includes(id);
  }

  quitarGradoEditar(id: number): void {
    this.editar.id_grados = this.editar.id_grados.filter((g) => g !== id);
  }

  toggleSeccionEditar(id: number): void {
    const actuales = this.editar.id_secciones;
    this.editar.id_secciones = actuales.includes(id)
      ? actuales.filter((s) => s !== id)
      : [...actuales, id];
  }

  seccionSeleccionadaEditar(id: number): boolean {
    return this.editar.id_secciones.includes(id);
  }

  quitarSeccionEditar(id: number): void {
    this.editar.id_secciones = this.editar.id_secciones.filter((s) => s !== id);
  }

  eliminarAdjuntoEnEdicion(adjunto: Adjunto): void {
    if (!confirm(`¿Eliminar "${adjunto.nombre_original}"?`)) return;

    this.http.delete(`${environment.apiUrl}/adjunto/${adjunto.id}`).subscribe({
      next: () => {
        this.adjuntosEditando.update((lista) => lista.filter((a) => a.id !== adjunto.id));
        const id = this.idEditando();
        if (id) {
          this.comunicados.update((lista) =>
            lista.map((c) =>
              c.id_comunicado === id
                ? { ...c, adjuntos: c.adjuntos?.filter((a) => a.id !== adjunto.id) }
                : c,
            ),
          );
        }
      },
      error: () => this.error.set('No se pudo eliminar el archivo'),
    });
  }

  guardarEdicion(): void {
    if (!this.editar.titulo || !this.editar.contenido) {
      this.error.set('El título y contenido son obligatorios');
      return;
    }

    const id = this.idEditando();
    if (!id) return;

    const destinatarios = this.construirDestinatarios(this.editar);

    this.guardando.set(true);
    const form = new FormData();
    form.append('titulo', this.editar.titulo);
    form.append('contenido', this.editar.contenido);
    form.append('destinatarios', JSON.stringify(destinatarios));
    for (const item of this.archivosSeleccionados) {
      form.append('archivos', item.file);
    }

    this.http.patch(`${environment.apiUrl}/comunicado/${id}`, form).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargar();
      },
      error: () => {
        this.guardando.set(false);
        this.error.set('Error al actualizar el comunicado');
      },
    });
  }

  private construirDestinatarios(datos: ComunicadoForm): Destinatario[] {
    const destinatarios: Destinatario[] = [];

    if (datos.tipo === 'todos') {
      destinatarios.push({ tipo: 'todos' });
    } else if (datos.tipo === 'docentes') {
      if (datos.id_usuarios.length === 0) {
        destinatarios.push({ tipo: 'docentes' });
      } else {
        for (const id_usuario of datos.id_usuarios) {
          destinatarios.push({ tipo: 'docentes', id_usuario });
        }
      }
    } else if (datos.tipo === 'estudiantes') {
      const grados = datos.id_grados;
      const secciones = datos.id_secciones;

      if (grados.length === 0 && secciones.length === 0) {
        destinatarios.push({ tipo: 'estudiantes' });
      } else if (grados.length > 0 && secciones.length === 0) {
        for (const id_grado of grados) {
          destinatarios.push({ tipo: 'estudiantes', id_grado });
        }
      } else if (grados.length === 0 && secciones.length > 0) {
        for (const id_seccion of secciones) {
          destinatarios.push({ tipo: 'estudiantes', id_seccion });
        }
      } else {
        for (const id_grado of grados) {
          for (const id_seccion of secciones) {
            destinatarios.push({ tipo: 'estudiantes', id_grado, id_seccion });
          }
        }
      }
    }

    return destinatarios;
  }

  cerrarModal(): void {
    this.limpiarArchivos();
    this.modalNuevo.set(false);
    this.modalEditar.set(false);
    this.modalEliminar.set(false);
    this.idEditando.set(null);
  }

  // ===== Archivos =====

  onArchivosChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const nuevos = Array.from(input.files ?? []);
    input.value = '';

    const disponibles = MAX_ARCHIVOS - this.archivosSeleccionados.length;
    if (disponibles <= 0) {
      this.error.set(`Máximo ${MAX_ARCHIVOS} archivos por comunicado`);
      return;
    }

    for (const file of nuevos.slice(0, disponibles)) {
      this.archivosSeleccionados.push({
        file,
        previewUrl: this.esImagen(file.name) ? URL.createObjectURL(file) : null,
      });
    }
  }

  quitarArchivo(index: number): void {
    const item = this.archivosSeleccionados[index];
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    this.archivosSeleccionados = this.archivosSeleccionados.filter(
      (_, i) => i !== index,
    );
  }

  limpiarArchivos(): void {
    for (const item of this.archivosSeleccionados) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
    this.archivosSeleccionados = [];
  }

  formatearTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  extensionDe(nombre: string): string {
    const partes = nombre.split('.');
    return partes.length > 1 ? partes.pop()!.toLowerCase() : '';
  }

  esImagen(nombre: string): boolean {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(this.extensionDe(nombre));
  }

  categoriaArchivo(nombre: string): CategoriaArchivo {
    const ext = this.extensionDe(nombre);
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
    if (this.esImagen(nombre)) return 'imagen';
    return 'otro';
  }

  nombreArchivo(ruta: string): string {
    const base = ruta.split('/').pop() ?? ruta;
    try {
      return decodeURIComponent(base);
    } catch {
      return base;
    }
  }

  // ===== Grados / secciones (nombres) =====

  nombreGrado(id: number): string {
    return this.grados().find((g) => g.id_grado === id)?.nombre ?? '';
  }

  nombreSeccion(id: number): string {
    return this.secciones().find((s) => s.id_seccion === id)?.nombre ?? '';
  }

    // ===== Eliminar comunicado =====

    confirmarEliminar(id: number): void {
      this.idAEliminar.set(id);
      this.modalEliminar.set(true);
    }

    eliminar(): void {
      const id = this.idAEliminar();
      if (!id) return;
      this.http.delete(`${environment.apiUrl}/comunicado/${id}`).subscribe({
        next: () => {
          this.cerrarModal();
          this.cargar();
        },
      });
    }

    // ===== Descargas =====
    private extensionesVisibles = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'txt'];

    abrirArchivo(url: string, nombre: string): void {
      this.http.get(url, { responseType: 'blob' }).subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          const ext = this.extensionDe(nombre);

          if (this.extensionesVisibles.includes(ext)) {
            const ventana = window.open(objectUrl, '_blank');
            if (!ventana) {
              // el navegador bloqueó el popup: forzamos descarga como respaldo
              this.forzarDescarga(objectUrl, nombre);
            } else {
              setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
            }
          } else {
            this.forzarDescarga(objectUrl, nombre);
          }
        },
        error: () => this.error.set('No se pudo abrir el archivo'),
      });
    }

    private forzarDescarga(objectUrl: string, nombre: string): void {
      const enlace = document.createElement('a');
      enlace.href = objectUrl;
      enlace.download = nombre;
      enlace.click();
      URL.revokeObjectURL(objectUrl);
    }

    verAdjuntoLegado(c: Comunicado): void {
      this.abrirArchivo(
        `${environment.apiUrl}/comunicado/${c.id_comunicado}/descargar`,
        c.archivo ? this.nombreArchivo(c.archivo) : 'archivo',
      );
    }

    verAdjunto(adjunto: Adjunto): void {
      this.abrirArchivo(
        `${environment.apiUrl}/adjunto/${adjunto.id}/descargar`,
        adjunto.nombre_original,
      );
    }

    descargarAdjunto(adjunto: Adjunto): void {
      this.http
        .get(`${environment.apiUrl}/adjunto/${adjunto.id}/descargar`, { responseType: 'blob' })
        .subscribe({
          next: (blob) => {
            const objectUrl = URL.createObjectURL(blob);
            this.forzarDescarga(objectUrl, adjunto.nombre_original);
          },
          error: () => this.error.set('No se pudo descargar el archivo'),
        });
    }

    eliminarAdjunto(comunicado: Comunicado, adjunto: Adjunto): void {
      if (!confirm(`¿Eliminar "${adjunto.nombre_original}"?`)) return;

      this.http.delete(`${environment.apiUrl}/adjunto/${adjunto.id}`).subscribe({
        next: () => {
          this.comunicados.update((lista) =>
            lista.map((c) =>
              c.id_comunicado === comunicado.id_comunicado
                ? { ...c, adjuntos: c.adjuntos?.filter((a) => a.id !== adjunto.id) }
                : c,
            ),
          );
        },
        error: () => this.error.set('No se pudo eliminar el archivo'),
      });
    }

    // ===== Etiquetas / badges =====

    etiquetaAudiencia(c: Comunicado): string {
      const destinatarios = c.destinatarios ?? [];
      if (!destinatarios.length || destinatarios[0].tipo === 'todos') return 'Todos';

      const tipo = destinatarios[0].tipo;

      if (tipo === 'docentes') {
        const nombres = destinatarios
          .filter((d) => d.usuario)
          .map((d) => `${d.usuario!.nombres} ${d.usuario!.apellidos}`);
        if (!nombres.length) return 'Todos los docentes';
        return nombres.length === 1
          ? `Docente: ${nombres[0]}`
          : `${nombres.length} docentes`;
      }

      const conCombinacion = destinatarios.filter((d) => d.grado || d.seccion);
      if (!conCombinacion.length) return 'Todos los estudiantes';
      if (conCombinacion.length === 1) {
        const d = conCombinacion[0];
        const partes: string[] = [];
        if (d.grado) partes.push(d.grado.nombre);
        if (d.seccion) partes.push(d.seccion.nombre);
        return `Estudiantes · ${partes.join(' ')}`;
      }
      return `Estudiantes · ${conCombinacion.length} grupos`;
    }

    claseBadgeAudiencia(c: Comunicado): string {
      const tipo = c.destinatarios?.[0]?.tipo ?? 'todos';
      switch (tipo) {
        case 'docentes':
          return 'badge-docentes';
        case 'estudiantes':
          return 'badge-estudiantes';
        default:
          return 'badge-todos';
      }
    }
  }