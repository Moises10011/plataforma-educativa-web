import { Component, OnInit, signal } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';
  import { HttpClient } from '@angular/common/http';
  import { environment } from '../../../environments/environment';

  interface Estudiante {
    id_usuario: number;
    nombres: string;
    apellidos: string;
    correo: string;
    estado: boolean;
  }

  interface Matricula {
    id_matricula: number;
    usuario: { id_usuario: number; nombres: string; apellidos: string; correo: string };
    grado: { id_grado: number; nombre: string };
    seccion: { id_seccion: number; nombre: string };
    periodo: { id_periodo: number; nombre: string };
    estado: boolean;
  }

  interface Grado { id_grado: number; nombre: string; }
  interface Seccion { id_seccion: number; nombre: string; }
  interface PeriodoAcademico { id_periodo: number; nombre: string; estado: boolean; }

  @Component({
    selector: 'app-admin-estudiantes',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './estudiantes.html',
    styleUrl: './estudiantes.css',
  })
  export class AdminEstudiantes implements OnInit {
    matriculas = signal<Matricula[]>([]);
    estudiantes = signal<Estudiante[]>([]);
    grados = signal<Grado[]>([]);
    secciones = signal<Seccion[]>([]);
    periodos = signal<PeriodoAcademico[]>([]);
    cargando = signal(true);

    // Filtros
    filtroGrado = signal<number | null>(null);
    filtroSeccion = signal<number | null>(null);
    filtroPeriodo = signal<number | null>(null);
    filtroBusqueda = signal('');

    // Modales
    modalMatricular = signal(false);
    modalEditar = signal(false);
    modalEliminar = signal(false);
    matriculaAEditar = signal<Matricula | null>(null);
    matriculaAEliminar = signal<number | null>(null);
    guardando = signal(false);
    exportando = signal(false);
    error = signal('');

    nuevaMatricula = {
      id_usuario: null as number | null,
      id_grado: null as number | null,
      id_seccion: null as number | null,
      id_periodo: null as number | null,
    };

    editarForm = {
      id_grado: null as number | null,
      id_seccion: null as number | null,
      id_periodo: null as number | null,
      estado: true,
    };

    constructor(private http: HttpClient) {}

    ngOnInit(): void {
      this.cargarCatalogos();
      this.cargarMatriculas();
    }

    cargarCatalogos(): void {
      this.http.get<Estudiante[]>(`${environment.apiUrl}/usuario`).subscribe({
        next: (data) => this.estudiantes.set(data.filter((u: any) =>
          u.roles?.some((r: any) => r.nombre === 'Estudiante')
        )),
      });
      this.http.get<Grado[]>(`${environment.apiUrl}/grado`).subscribe({ next: (d) => this.grados.set(d) });
      this.http.get<Seccion[]>(`${environment.apiUrl}/seccion`).subscribe({ next: (d) => this.secciones.set(d) });
      this.http.get<PeriodoAcademico[]>(`${environment.apiUrl}/periodo-academico`).subscribe({ next: (d) => this.periodos.set(d) });
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
          if (!nombre.includes(q) && !correo.includes(q)) return false;
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

    abrirModalMatricular(): void {
      this.nuevaMatricula = { id_usuario: null, id_grado: null, id_seccion: null, id_periodo: null };
      this.error.set('');
      this.modalMatricular.set(true);
    }

    abrirModalEditar(m: Matricula): void {
      this.matriculaAEditar.set(m);
      this.editarForm = {
        id_grado: m.grado.id_grado,
        id_seccion: m.seccion.id_seccion,
        id_periodo: m.periodo.id_periodo,
        estado: m.estado,
      };
      this.error.set('');
      this.modalEditar.set(true);
    }

    cerrarModal(): void {
      this.modalMatricular.set(false);
      this.modalEditar.set(false);
      this.modalEliminar.set(false);
    }

    matricular(): void {
      const { id_usuario, id_grado, id_seccion, id_periodo } = this.nuevaMatricula;
      if (!id_usuario || !id_grado || !id_seccion || !id_periodo) {
        this.error.set('Completa todos los campos');
        return;
      }
      this.guardando.set(true);
      this.http.post(`${environment.apiUrl}/matricula`, {
        id_usuario, id_grado, id_seccion, id_periodo,
      }).subscribe({
        next: () => { this.guardando.set(false); this.cerrarModal(); this.cargarMatriculas(); },
        error: () => { this.guardando.set(false); this.error.set('Error al matricular'); },
      });
    }

    guardarEdicion(): void {
      const m = this.matriculaAEditar();
      if (!m) return;
      this.guardando.set(true);
      this.http.put(`${environment.apiUrl}/matricula/${m.id_matricula}`, this.editarForm).subscribe({
        next: () => { this.guardando.set(false); this.cerrarModal(); this.cargarMatriculas(); },
        error: () => { this.guardando.set(false); this.error.set('Error al actualizar'); },
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

    periodoActivo(): PeriodoAcademico | undefined {
      return this.periodos().find((p) => p.estado);
    }
  }