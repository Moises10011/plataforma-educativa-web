import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface DocumentoInstitucional {
  id_documento: number;
  titulo: string;
  descripcion?: string;
  archivo: string;
  fecha_subida: string;
}

@Component({
  selector: 'app-admin-institucionales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './institucionales.html',
  styleUrl: './institucionales.css',
})
export class AdminInstitucionales implements OnInit {
  documentos = signal<DocumentoInstitucional[]>([]);
  cargando = signal(true);
  modalSubir = signal(false);
  modalEliminar = signal(false);
  idAEliminar = signal<number | null>(null);
  guardando = signal(false);
  error = signal('');

  nuevo = { titulo: '', descripcion: '' };
  archivoSeleccionado: File | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.http.get<DocumentoInstitucional[]>(`${environment.apiUrl}/documento-institucional`).subscribe({
      next: (data) => { this.documentos.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  abrirModal(): void {
    this.nuevo = { titulo: '', descripcion: '' };
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
    if (!this.nuevo.titulo || !this.archivoSeleccionado) {
      this.error.set('El título y el archivo son obligatorios');
      return;
    }
    this.guardando.set(true);
    const form = new FormData();
    form.append('titulo', this.nuevo.titulo);
    form.append('descripcion', this.nuevo.descripcion);
    form.append('archivo', this.archivoSeleccionado);

    this.http.post(`${environment.apiUrl}/documento-institucional`, form).subscribe({
      next: () => { this.guardando.set(false); this.cerrarModal(); this.cargar(); },
      error: () => { this.guardando.set(false); this.error.set('Error al subir el documento'); },
    });
  }

  confirmarEliminar(id: number): void {
    this.idAEliminar.set(id);
    this.modalEliminar.set(true);
  }

  eliminar(): void {
    const id = this.idAEliminar();
    if (!id) return;
    this.http.delete(`${environment.apiUrl}/documento-institucional/${id}`).subscribe({
      next: () => { this.cerrarModal(); this.cargar(); },
    });
  }

  descargar(d: DocumentoInstitucional): void {
    window.open(`${environment.apiUrl}/uploads/documentos-institucionales/${d.archivo}`, '_blank');
  }
}