import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Libreta {
  id_libreta: number;
  archivo: string;
  fecha_subida: string;
  periodo?: {
    id_periodo: number;
    nombre: string;
  };
}

@Component({
  selector: 'app-estudiante-notas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notas.html',
  styleUrl: './notas.css',
})
export class EstudianteNotas implements OnInit {
  libretas = signal<Libreta[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  private extensionesVisibles = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

  private mimePorExtensionMap: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<Libreta[]>(`${environment.apiUrl}/libreta/estudiante/mis-libretas`)
      .subscribe({
        next: (data) => {
          this.libretas.set(data ?? []);
          this.cargando.set(false);
        },
        error: (error) => {
          console.error('Error al cargar libretas:', error);
          this.cargando.set(false);
        },
      });
  }

  esImagen(archivo: string): boolean {
    return /\.(png|jpe?g|gif|webp)$/i.test(archivo);
  }

  private extension(archivo: string): string {
    return archivo.split('.').pop()?.toLowerCase() ?? '';
  }

  private mimePorExtension(ext: string): string {
    return this.mimePorExtensionMap[ext] ?? 'application/octet-stream';
  }

  verLibreta(libreta: Libreta): void {
    const ext = this.extension(libreta.archivo);
    const esVisible = this.extensionesVisibles.includes(ext);
    const ventana = esVisible ? window.open('', '_blank') : null;

    this.http.get(`${environment.apiUrl}/libreta/${libreta.id_libreta}/ver`, {
      responseType: 'blob',
    }).subscribe({
      next: (blob) => {
        const tipoBlob = new Blob([blob], { type: blob.type || this.mimePorExtension(ext) });
        const url = window.URL.createObjectURL(tipoBlob);

        if (esVisible && ventana) {
          ventana.location.href = url;
        } else {
          this.descargarBlob(url, `${libreta.periodo?.nombre || 'libreta'}.${ext}`);
        }
        setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
      },
      error: () => {
        ventana?.close();
        this.error.set('No se pudo abrir la libreta.');
      },
    });
  }

  descargarLibreta(libreta: Libreta): void {
    const ext = this.extension(libreta.archivo);
    this.http.get(`${environment.apiUrl}/libreta/${libreta.id_libreta}/descargar`, {
      responseType: 'blob',
    }).subscribe({
      next: (blob) => {
        const tipoBlob = new Blob([blob], { type: blob.type || this.mimePorExtension(ext) });
        const url = window.URL.createObjectURL(tipoBlob);
        this.descargarBlob(url, `${libreta.periodo?.nombre || 'libreta'}.${ext}`);
        window.URL.revokeObjectURL(url);
      },
      error: () => this.error.set('No se pudo descargar la libreta.'),
    });
  }

  private descargarBlob(url: string, nombre: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}