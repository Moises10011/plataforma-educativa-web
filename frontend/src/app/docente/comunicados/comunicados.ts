import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Adjunto {
  id: number;
  nombre_original: string;
  mime_type: string;
  tamano: number;
}

interface Destinatario {
  tipo: 'todos' | 'estudiantes' | 'docentes';
}

interface Comunicado {
  id_comunicado: number;
  titulo: string;
  contenido: string;
  archivo?: string;
  adjuntos?: Adjunto[];
  fecha_publicacion: string;
  destinatarios: Destinatario[];
}

@Component({
  selector: 'app-docente-comunicados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comunicados.html',
  styleUrl: './comunicados.css',
})
export class DocenteComunicados implements OnInit {
  comunicados = signal<Comunicado[]>([]);
  cargando = signal(true);
  seleccionado = signal<Comunicado | null>(null);

  private extensionesVisibles = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Comunicado[]>('/api/comunicado').subscribe({
      next: (data) => {
        this.comunicados.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  seleccionar(c: Comunicado): void {
    this.seleccionado.set(
      this.seleccionado()?.id_comunicado === c.id_comunicado ? null : c
    );
  }

  esReciente(fecha: string): boolean {
    const dias = (Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24);
    return dias <= 3;
  }

  etiquetaAudiencia(c: Comunicado): string {
    const d = c.destinatarios?.[0];
    if (!d || d.tipo === 'todos') return 'Todos';
    if (d.tipo === 'docentes') return 'Docentes';
    return 'Estudiantes';
  }

  extensionDe(nombre: string): string {
    const partes = nombre.split('.');
    return partes.length > 1 ? partes.pop()!.toUpperCase() : '';
  }

  formatearTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  nombreArchivoLegado(ruta: string): string {
    const base = ruta.split('/').pop() ?? ruta;
    try {
      return decodeURIComponent(base);
    } catch {
      return base;
    }
  }

  abrirAdjunto(a: Adjunto): void {
    this.descargarOAbrir(`/api/adjunto/${a.id}/descargar`, a.nombre_original);
  }

  abrirLegado(c: Comunicado): void {
    if (!c.archivo) return;
    this.descargarOAbrir(
      `/api/comunicado/${c.id_comunicado}/descargar`,
      this.nombreArchivoLegado(c.archivo),
    );
  }

  private descargarOAbrir(url: string, nombre: string): void {
    const ext = this.extensionDe(nombre).toLowerCase();
    const esVisible = this.extensionesVisibles.includes(ext);
    const ventana = esVisible ? window.open('', '_blank') : null;

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        if (esVisible && ventana) {
          ventana.location.href = objectUrl;
          setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
        } else {
          const a = document.createElement('a');
          a.href = objectUrl;
          a.download = nombre;
          a.click();
          URL.revokeObjectURL(objectUrl);
        }
      },
      error: () => ventana?.close(),
    });
  }

  trackByComunicado(_: number, c: Comunicado): number {
    return c.id_comunicado;
  }
}