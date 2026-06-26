import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Comunicado {
  id_comunicado: number;
  titulo: string;
  contenido: string;
  archivo?: string;
  fecha_publicacion: string;
  autor?: { nombres: string; apellidos: string };
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
  cargando = signal(true);
  modalNuevo = signal(false);
  modalEliminar = signal(false);
  idAEliminar = signal<number | null>(null);
  guardando = signal(false);
  error = signal('');

  nuevo = { titulo: '', contenido: '' };
  archivoSeleccionado: File | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.http.get<Comunicado[]>(`${environment.apiUrl}/comunicado`).subscribe({
      next: (data) => { this.comunicados.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  abrirModal(): void {
    this.nuevo = { titulo: '', contenido: '' };
    this.archivoSeleccionado = null;
    this.error.set('');
    this.modalNuevo.set(true);
  }

  cerrarModal(): void {
    this.modalNuevo.set(false);
    this.modalEliminar.set(false);
  }

  onArchivoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.archivoSeleccionado = input.files?.[0] ?? null;
  }

  guardar(): void {
    if (!this.nuevo.titulo || !this.nuevo.contenido) {
      this.error.set('El título y contenido son obligatorios');
      return;
    }
    this.guardando.set(true);
    const form = new FormData();
    form.append('titulo', this.nuevo.titulo);
    form.append('contenido', this.nuevo.contenido);
    if (this.archivoSeleccionado) form.append('archivo', this.archivoSeleccionado);

    this.http.post(`${environment.apiUrl}/comunicado`, form).subscribe({
      next: () => { this.guardando.set(false); this.cerrarModal(); this.cargar(); },
      error: () => { this.guardando.set(false); this.error.set('Error al publicar el comunicado'); },
    });
  }

  confirmarEliminar(id: number): void {
    this.idAEliminar.set(id);
    this.modalEliminar.set(true);
  }

  eliminar(): void {
    const id = this.idAEliminar();
    if (!id) return;
    this.http.delete(`${environment.apiUrl}/comunicado/${id}`).subscribe({
      next: () => { this.cerrarModal(); this.cargar(); },
    });
  }

  descargar(c: Comunicado): void {
    window.open(`${environment.apiUrl}/comunicado/${c.id_comunicado}/descargar`, '_blank');
  }
}