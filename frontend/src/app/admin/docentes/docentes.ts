import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { forkJoin } from 'rxjs';

interface Docente {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  dni: string | null;
  telefono: string | null;
  correo: string;
  estado: boolean;
}

interface AsignacionCurso {
  id_asignacion: number;
  docente: { id_usuario: number; nombres: string; apellidos: string };
  curso: { id_curso: number; nombre: string };
  grado: { id_grado: number; nombre: string };
  seccion: { id_seccion: number; nombre: string };
  periodo: { id_periodo: number; nombre: string };
}

interface Curso {
  id_curso: number;
  nombre: string;
}

interface Grado {
  id_grado: number;
  nombre: string;
}

interface Seccion {
  id_seccion: number;
  nombre: string;
}

interface PeriodoAcademico {
  id_periodo: number;
  nombre: string;
  estado: boolean;
}

@Component({
  selector: 'app-admin-docentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './docentes.html',
  styleUrl: './docentes.css',
})
export class AdminDocentes implements OnInit {

  docentes = signal<Docente[]>([]);
  asignaciones = signal<AsignacionCurso[]>([]);
  cursos = signal<Curso[]>([]);
  grados = signal<Grado[]>([]);
  secciones = signal<Seccion[]>([]);
  periodos = signal<PeriodoAcademico[]>([]);
  cargando = signal(true);
  cargandoSelects = signal(true);

  vistaActual = signal<'docentes' | 'asignaciones'>('docentes');
  modalAsignar = signal(false);
  modalEliminar = signal(false);
  modalNuevoDocente = signal(false);
  modalVerCursos = signal(false);
  modalEditarDocente = signal(false);
  modalEliminarDocente = signal(false);
  modalEliminarAsignacion = signal(false);
  
  asignacionAEliminar = signal<number | null>(null);
  credencialesGeneradas = signal<{ correo: string; password: string } | null>(null);
  docenteSeleccionado = signal<Docente | null>(null);
  docenteAEditar = signal<Docente | null>(null);
  docenteAEliminar = signal<number | null>(null);
  guardando = signal(false);
  error = signal('');

  filtroBusqueda = signal('');
  filtroCurso = signal<number | null>(null);
  filtroGrado = signal<number | null>(null);
  filtroSeccion = signal<number | null>(null);

  editarDocenteForm = {
    id_usuario: 0,
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    direccion: '',
    fecha_nacimiento: '',
    estado: true
  };

  docentesFiltrados = computed(() => {
    let lista = this.docentes();

    const busqueda = this.filtroBusqueda().toLowerCase().trim();
    if (busqueda) {
      lista = lista.filter(d =>
        `${d.nombres} ${d.apellidos}`.toLowerCase().includes(busqueda) ||
        d.correo.toLowerCase().includes(busqueda)
      );
    }

    const curso = this.filtroCurso();
    if (curso) {
      const idsDocentes = new Set(
        this.asignaciones()
          .filter(a => String(a.curso.id_curso) === String(curso))
          .map(a => a.docente.id_usuario)
      );
      lista = lista.filter(d => idsDocentes.has(d.id_usuario));
    }

    const grado = this.filtroGrado();
    if (grado) {
      const idsDocentes = new Set(
        this.asignaciones()
          .filter(a => String(a.grado.id_grado) === String(grado))
          .map(a => a.docente.id_usuario)
      );
      lista = lista.filter(d => idsDocentes.has(d.id_usuario));
    }

    const seccion = this.filtroSeccion();
    if (seccion) {
      const idsDocentes = new Set(
        this.asignaciones()
          .filter(a => String(a.seccion.id_seccion) === String(seccion))
          .map(a => a.docente.id_usuario)
      );
      lista = lista.filter(d => idsDocentes.has(d.id_usuario));
    }

    return lista;
  });

  cursosDelDocenteSeleccionado = computed(() => {
    const docente = this.docenteSeleccionado();
    if (!docente) return [];
    return this.asignaciones().filter(a => a.docente.id_usuario === docente.id_usuario);
  });

  docenteMap = computed(() => {
    const map = new Map<number, string>();
    this.docentes().forEach(d => {
      map.set(d.id_usuario, `${d.nombres} ${d.apellidos}`);
    });
    return map;
  });

  nuevaAsignacion: {
    id_usuario_docente: number | null;
    id_curso: number | null;
    id_grado: number | null;
    id_seccion: number | null;
    id_periodo: number | null;
  } = {
    id_usuario_docente: null,
    id_curso: null,
    id_grado: null,
    id_seccion: null,
    id_periodo: null,
  };

  nuevoDocenteForm = {
    nombres: '',
    apellidos: '',
    dni: '',
    telefono: '',
    direccion: '',
    fecha_nacimiento: '',
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarTodo();
  }

  cargarTodo(): void {
    this.cargando.set(true);
    this.cargandoSelects.set(true);
    
    forkJoin({
      usuarios: this.http.get<any[]>(`${environment.apiUrl}/usuario`),
      asignaciones: this.http.get<AsignacionCurso[]>(`${environment.apiUrl}/asignacion-curso`),
      cursos: this.http.get<Curso[]>(`${environment.apiUrl}/curso`),
      grados: this.http.get<Grado[]>(`${environment.apiUrl}/grado`),
      secciones: this.http.get<Seccion[]>(`${environment.apiUrl}/seccion`),
      periodos: this.http.get<PeriodoAcademico[]>(`${environment.apiUrl}/periodo-academico`)
    }).subscribe({
      next: ({ usuarios, asignaciones, cursos, grados, secciones, periodos }) => {
        const docentesFiltrados = usuarios
          .filter(u => u.roles?.some((r: any) => r.nombre_rol === 'Docente'))
          .map(u => ({
            id_usuario: u.id_usuario,
            nombres: u.nombres,
            apellidos: u.apellidos,
            dni: u.dni,
            telefono: u.telefono,
            correo: u.correo,
            estado: u.estado
          }));
        
        this.docentes.set(docentesFiltrados);
        this.asignaciones.set(asignaciones);
        this.cursos.set(cursos);
        this.grados.set(grados);
        this.secciones.set(secciones);
        this.periodos.set(periodos);
        this.cargando.set(false);
        this.cargandoSelects.set(false);
      },
      error: (err) => {
        console.error('Error cargando datos:', err);
        this.cargando.set(false);
        this.cargandoSelects.set(false);
        this.error.set('Error al cargar los datos');
      }
    });
  }

  // ============ MÉTODOS AUXILIARES ============
  
  getCursoNombre(id: number): string {
    return this.cursos().find(c => c.id_curso === id)?.nombre || '';
  }

  getGradoNombre(id: number): string {
    return this.grados().find(g => g.id_grado === id)?.nombre || '';
  }

  getSeccionNombre(id: number): string {
    return this.secciones().find(s => s.id_seccion === id)?.nombre || '';
  }

  // ============ MODALES ============

  abrirModalAsignar(): void {
    this.nuevaAsignacion = { id_usuario_docente: null, id_curso: null, id_grado: null, id_seccion: null, id_periodo: null };
    this.error.set('');
    this.modalAsignar.set(true);
  }

  abrirModalNuevoDocente(): void {
    this.nuevoDocenteForm = { nombres: '', apellidos: '', dni: '', telefono: '', direccion: '', fecha_nacimiento: '' };
    this.credencialesGeneradas.set(null);
    this.error.set('');
    this.modalNuevoDocente.set(true);
  }

  abrirModalCursos(docente: Docente): void {
    this.docenteSeleccionado.set(docente);
    this.modalVerCursos.set(true);
  }

  abrirModalEditar(docente: Docente): void {
    this.docenteAEditar.set(docente);
    this.editarDocenteForm = {
      id_usuario: docente.id_usuario,
      nombres: docente.nombres,
      apellidos: docente.apellidos,
      dni: docente.dni || '',
      telefono: docente.telefono || '',
      direccion: '',
      fecha_nacimiento: '',
      estado: docente.estado
    };
    this.error.set('');
    this.modalEditarDocente.set(true);
  }

  confirmarEliminarDocente(id: number): void {
    this.docenteAEliminar.set(id);
    this.modalEliminarDocente.set(true);
  }

  confirmarEliminarAsignacion(id: number): void {
    this.asignacionAEliminar.set(id);
    this.modalEliminarAsignacion.set(true);
  }

  cerrarModal(): void {
    this.modalAsignar.set(false);
    this.modalEliminar.set(false);
    this.modalNuevoDocente.set(false);
    this.modalVerCursos.set(false);
    this.modalEditarDocente.set(false);
    this.modalEliminarDocente.set(false);
    this.modalEliminarAsignacion.set(false);
    this.credencialesGeneradas.set(null);
    this.docenteSeleccionado.set(null);
    this.docenteAEditar.set(null);
    this.docenteAEliminar.set(null);
    this.asignacionAEliminar.set(null);
  }

  // ============ FILTROS ============

  limpiarFiltros(): void {
    this.filtroBusqueda.set('');
    this.filtroCurso.set(null);
    this.filtroGrado.set(null);
    this.filtroSeccion.set(null);
  }

  // ============ CONTADORES ============

  contarCursos(idDocente: number): number {
    return this.asignaciones().filter(a => a.docente.id_usuario === idDocente).length;
  }

  nombreDocente(id: number): string {
    return this.docenteMap().get(id) || '';
  }

  // ============ ASIGNACIONES ============

guardarAsignacion(): void {
  const { id_usuario_docente, id_curso, id_grado, id_seccion, id_periodo } = this.nuevaAsignacion;
  if (!id_usuario_docente || !id_curso || !id_grado || !id_seccion || !id_periodo) {
    this.error.set('Completa todos los campos');
    return;
  }

  // Verificar si ya existe la asignación
  const existe = this.asignaciones().some( a => 
      a.docente.id_usuario === id_usuario_docente &&
      a.curso.id_curso === id_curso &&
      a.grado.id_grado === id_grado &&
      a.seccion.id_seccion === id_seccion &&
      a.periodo.id_periodo === id_periodo
    );

    if (existe) {
      this.error.set('Esta asignación ya existe');
      return;
    }

    // Crear objeto con el nombre correcto que espera el backend
    const dataToSend = {
      id_usuario_docente: id_usuario_docente,
      id_curso: id_curso,
      id_grado: id_grado,
      id_seccion: id_seccion,
      id_periodo: id_periodo
    };

    this.guardando.set(true);
    this.http.post(`${environment.apiUrl}/asignacion-curso`, dataToSend).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargarTodo();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al guardar la asignación');
      },
    });
  }
  eliminarAsignacion(): void {
    const id = this.asignacionAEliminar();
    if (!id) return;
    this.guardando.set(true);
    this.http.delete(`${environment.apiUrl}/asignacion-curso/${id}`).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cerrarModal();
        this.cargarTodo();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al eliminar la asignación');
      },
    });
  }

  // ============ DOCENTES ============

  guardarNuevoDocente(): void {
    const { nombres, apellidos, dni } = this.nuevoDocenteForm;
    if (!nombres || !apellidos || !dni) {
      this.error.set('Completa nombres, apellidos y DNI');
      return;
    }
    this.guardando.set(true);
    this.http.post<any>(`${environment.apiUrl}/usuario/crear-con-rol`, {
      ...this.nuevoDocenteForm,
      rol: 'Docente',
    }).subscribe({
      next: (res) => {
        this.guardando.set(false);
        this.credencialesGeneradas.set({ correo: res.correo_generado, password: res.password_generado });
        this.cargarTodo();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'Error al crear docente');
      },
    });
  }

  guardarEdicionDocente(): void {
    const { id_usuario, ...dataToSend } = this.editarDocenteForm;
    
    if (!dataToSend.nombres || !dataToSend.apellidos || !dataToSend.dni) {
      this.error.set('Completa nombres, apellidos y DNI');
      return;
    }

    this.guardando.set(true);
    this.http.put(`${environment.apiUrl}/usuario/${id_usuario}`, dataToSend)
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModal();
          this.cargarTodo();
        },
        error: (err) => {
          this.guardando.set(false);
          this.error.set(err?.error?.message || 'Error al actualizar docente');
        }
      });
  }

  eliminarDocente(): void {
    const id = this.docenteAEliminar();
    if (!id) return;
    
    this.guardando.set(true);
    this.http.delete(`${environment.apiUrl}/usuario/${id}`)
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.cerrarModal();
          this.cargarTodo();
        },
        error: (err) => {
          this.guardando.set(false);
          this.error.set(err?.error?.message || 'Error al eliminar docente');
        }
      });
  }
}