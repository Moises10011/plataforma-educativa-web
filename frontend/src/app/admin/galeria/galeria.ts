import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ImagenGaleria {
  id_imagen: number;
  titulo: string;
  descripcion?: string;
  imagen: string;       
  fecha_subida: string;
}

@Component({
  selector: 'app-admin-galeria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './galeria.html',
  styleUrl: './galeria.css',
})
export class AdminGaleria implements OnInit {
  imagenes = signal<ImagenGaleria[]>([]);
  cargando = signal(true);
  modalSubir = signal(false);
  modalEliminar = signal(false);
  idAEliminar = signal<number | null>(null);
  guardando = signal(false);
  error = signal('');

  nuevo = { titulo: '', descripcion: '' };
  archivos: File[] = [];
  previews: string[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.http.get<ImagenGaleria[]>(`${environment.apiUrl}/galeria`).subscribe({
      next: (data) => { this.imagenes.set(data); this.cargando.set(false); },
      error: () => this.cargando.set(false),
    });
  }

  abrirModal(): void {
    this.nuevo = { titulo: '', descripcion: '' };
    this.archivos = [];
    this.previews = [];
    this.error.set('');
    this.modalSubir.set(true);
  }

  cerrarModal(): void {
    this.modalSubir.set(false);
    this.modalEliminar.set(false);
  }

  onArchivosChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.archivos = Array.from(input.files);
    this.previews = this.archivos.map((f) => URL.createObjectURL(f));
  }

  guardar(): void {
    if (!this.nuevo.titulo || !this.archivos.length) {
      this.error.set('El título y al menos una imagen son obligatorios');
      return;
    }
    this.guardando.set(true);

    const uploads = this.archivos.map((archivo) => {
      const form = new FormData();
      form.append('titulo', this.nuevo.titulo);
      form.append('descripcion', this.nuevo.descripcion);
      form.append('imagen', archivo);       
      return this.http.post(`${environment.apiUrl}/galeria`, form).toPromise();
    });

    Promise.all(uploads).then(() => {
      this.guardando.set(false);
      this.cerrarModal();
      this.cargar();
    }).catch(() => {
      this.guardando.set(false);
      this.error.set('Error al subir las imágenes');
    });
  }

  confirmarEliminar(id: number): void {
    this.idAEliminar.set(id);
    this.modalEliminar.set(true);
  }

  eliminar(): void {
    const id = this.idAEliminar();
    if (!id) return;
    this.http.delete(`${environment.apiUrl}/galeria/${id}`).subscribe({
      next: () => { this.cerrarModal(); this.cargar(); },
    });
  }

  imagenUrl(imagen: string): string {
    if (!imagen) return '';                                      
    return `${environment.apiUrl}/uploads/galeria/${imagen}`;      
  }
}