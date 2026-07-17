import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface DocumentoInstitucional {
  id_documento: number;
  titulo: string;
  descripcion?: string;
  url_archivo: string;
  fecha_publicacion: string;
}

@Component({
  selector: 'app-docente-documentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documentos.html',
  styleUrl: './documentos.css',
})
export class DocenteDocumentos implements OnInit {
  documentos = signal<DocumentoInstitucional[]>([]);
  cargando = signal(true);

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
    this.http.get<DocumentoInstitucional[]>('/api/documento-institucional/mis-documentos').subscribe({
      next: (data) => {
        this.documentos.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  esReciente(fecha: string): boolean {
    const dias = (Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24);
    return dias <= 3;
  }

  nombreArchivo(url: string): string {
    const base = url.split('?')[0].split('/').pop() ?? '';
    try {
      return decodeURIComponent(base);
    } catch {
      return base;
    }
  }

  extensionDe(url: string): string {
    const nombre = this.nombreArchivo(url);
    const partes = nombre.split('.');
    return partes.length > 1 ? partes.pop()!.toUpperCase() : '';
  }

  private mimePorExtension(ext: string): string {
    return this.mimePorExtensionMap[ext] ?? 'application/octet-stream';
  }

  abrirDocumento(d: DocumentoInstitucional): void {
    const ext = d.url_archivo.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
    const esVisible = this.extensionesVisibles.includes(ext);

    const ventana = esVisible ? window.open('', '_blank') : null;

    this.http.get(d.url_archivo, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const tipoBlob = new Blob([blob], { type: blob.type || this.mimePorExtension(ext) });
        const url = window.URL.createObjectURL(tipoBlob);

        if (esVisible) {
          if (ventana) {
            ventana.location.href = url;
          }
          setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
        } else {
          const a = document.createElement('a');
          a.href = url;
          a.download = `${d.titulo}.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      },
      error: () => {
        ventana?.close();
        console.error('Error al abrir el documento');
      },
    });
  }

  trackByDocumento(_: number, d: DocumentoInstitucional): number {
    return d.id_documento;
  }
}