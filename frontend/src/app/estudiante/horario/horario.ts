import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface HorarioEstudiante {
  id_horario: number;
  archivo: string;
  descripcion?: string;
  fecha_subida: string;
  periodo: { nombre: string };
  grado: { nombre: string } | null;
  seccion: { nombre: string } | null;
}

@Component({
  selector: 'app-estudiante-horario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './horario.html',
  styleUrl: './horario.css',
})
export class EstudianteHorario implements OnInit {
  horarios = signal<HorarioEstudiante[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  private extensionesVisibles = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp'];

  private mimePorExtensionMap: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<HorarioEstudiante[]>(`${environment.apiUrl}/horario/estudiante/mi-horario`).subscribe({
      next: (data) => { this.horarios.set(data ?? []); this.cargando.set(false); },
      error: () => {
        this.error.set('No se pudo cargar tu horario.');
        this.cargando.set(false);
      },
    });
  }

  private extension(archivo: string): string {
    return archivo.split('.').pop()?.toLowerCase() ?? '';
  }

  private mimePorExtension(ext: string): string {
    return this.mimePorExtensionMap[ext] ?? 'application/octet-stream';
  }

  esImagen(archivo: string): boolean {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(this.extension(archivo));
  }

  verHorario(h: HorarioEstudiante): void {
    const ext = this.extension(h.archivo);
    const esVisible = this.extensionesVisibles.includes(ext);
    const ventana = esVisible ? window.open('', '_blank') : null;

    this.http.get(`${environment.apiUrl}/horario/${h.id_horario}/ver`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(new Blob([blob], { type: blob.type || this.mimePorExtension(ext) }));
        if (esVisible && ventana) {
          ventana.location.href = url;
        } else {
          this.descargarBlob(url, `horario.${ext}`);
        }
        setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
      },
      error: () => {
        ventana?.close();
        this.error.set('No se pudo abrir el horario.');
      },
    });
  }

  descargarHorario(h: HorarioEstudiante, event: Event): void {
    event.stopPropagation();
    const ext = this.extension(h.archivo);
    this.http.get(`${environment.apiUrl}/horario/${h.id_horario}/descargar`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(new Blob([blob], { type: blob.type || this.mimePorExtension(ext) }));
        this.descargarBlob(url, `horario.${ext}`);
        window.URL.revokeObjectURL(url);
      },
      error: () => this.error.set('No se pudo descargar el horario.'),
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

  trackByHorario(_: number, h: HorarioEstudiante): number {
    return h.id_horario;
  }
}