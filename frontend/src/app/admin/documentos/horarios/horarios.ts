import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Grado { id_grado: number; nombre: string; }
interface Seccion { id_seccion: number; nombre: string; }
interface PeriodoAcademico { id_periodo: number; nombre: string; estado: boolean; }

interface Horario {
  id_horario: number;
  grado: { id_grado: number; nombre: string };
  seccion: { id_seccion: number; nombre: string };
  periodo: { id_periodo: number; nombre: string };
  archivo: string;
  fecha_subida: string;
}

@Component({
  selector: 'app-admin-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horarios.html',
  styleUrl: './horarios.css',
})
export class AdminHorarios implements OnInit {
  horarios = signal<Horario[]>([]);
  grados = signal<Grado[]>([]);
  secciones = signal<Seccion[]>([]);
  periodos = signal<PeriodoAcademico[]>([]);
  cargando = signal(true);
  modalSubir = signal(false);
  modalEliminar = signal(false);
  idAEliminar = signal<number | null>(null);
  guardando = signal(false);
  error = signal('');

  nuevo = {
    id_grado: null as number | null,
    id_seccion: null as number | null,
    id_periodo: null as number | null,
  };
  archivoSeleccionado: File | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargar();
  }

  cargarCatalogos(): void {
    this.http.get<Grado[]>(`${environment.apiUrl}/grado`).subscribe({ next: (d) => this.grados.set(d) });
    this.http.get<Seccion[]>(`${environment.apiUrl}/seccion`).subscribe({ next: (d) => this.secciones.set(d) });
    this.http.get<PeriodoAcademico[]>(`${environment.apiUrl}/periodo-academico`).subscribe({ next: (d) => this.periodos.set(d) });
  }

  cargar(): void {
    this.cargando.set(true);
    this.http.get<Horario[]>(`${environment.apiUrl}/horario`).subscribe({
      next: (data) => { this.horarios.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  abrirModal(): void {
    this.nuevo = { id_grado: null, id_seccion: null, id_periodo: null };
    this.archivoSeleccionado = null;
    this.error.set('');
    this.modalSubir.set(true);
  }

  cerrarModal(): void {
    this.modalSubir.set(false);
    this.modalEliminar.set(false);
  }

  onArchivoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado = input.files?.[0] ?? null;
  }

  guardar(): void {
    const { id_grado, id_seccion, id_periodo } = this.nuevo;
    if (!id_grado || !id_seccion || !id_periodo || !this.archivoSeleccionado) {
      this.error.set('Completa todos los campos y selecciona un archivo');
      return;
    }
    this.guardando.set(true);
    const form = new FormData();
    form.append('id_grado', String(id_grado));
    form.append('id_seccion', String(id_seccion));
    form.append('id_periodo', String(id_periodo));
    form.append('archivo', this.archivoSeleccionado);

    this.http.post(`${environment.apiUrl}/horario`, form).subscribe({
      next: () => { this.guardando.set(false); this.cerrarModal(); this.cargar(); },
      error: () => { this.guardando.set(false); this.error.set('Error al subir el horario'); },
    });
  }

  confirmarEliminar(id: number): void {
    this.idAEliminar.set(id);
    this.modalEliminar.set(true);
  }

  eliminar(): void {
    const id = this.idAEliminar();
    if (!id) return;
    this.http.delete(`${environment.apiUrl}/horario/${id}`).subscribe({
      next: () => { this.cerrarModal(); this.cargar(); },
    });
  }

  descargar(h: Horario): void {
    window.open(`${environment.apiUrl}/uploads/horarios/${h.archivo}`, '_blank');
  }
}