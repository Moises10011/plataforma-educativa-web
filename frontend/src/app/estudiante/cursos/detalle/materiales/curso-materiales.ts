import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface MaterialEstudiante {
  id_material: number;
  titulo: string;
  descripcion?: string;
  url_archivo: string;
  fecha_publicacion: string;
}

@Component({
  selector: 'app-estudiante-curso-materiales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './curso-materiales.html',
})
export class CursoMateriales implements OnInit {
  idAsignacion = signal<number | null>(null);
  materiales = signal<MaterialEstudiante[]>([]);
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

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const id = this.route.parent?.snapshot.paramMap.get('id');
    if (id) {
      this.idAsignacion.set(Number(id));
      this.cargarMateriales(Number(id));
    }
  }

  private cargarMateriales(id: number): void {
    this.cargando.set(true);
    this.http.get<MaterialEstudiante[]>(`${environment.apiUrl}/asignacion-curso/${id}/materiales`).subscribe({
      next: (data) => { this.materiales.set(data); this.cargando.set(false); },
      error: () => { this.error.set('No se pudieron cargar los materiales.'); this.cargando.set(false); },
    });
  }

  extension(m: MaterialEstudiante): string {
    return m.url_archivo.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  }

  iconoPorExtension(ext: string): 'pdf' | 'imagen' | 'word' | 'excel' | 'ppt' | 'archivo' {
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'imagen';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx'].includes(ext)) return 'excel';
    if (['ppt', 'pptx'].includes(ext)) return 'ppt';
    return 'archivo';
  }

  private mimePorExtension(ext: string): string {
    return this.mimePorExtensionMap[ext] ?? 'application/octet-stream';
  }

  abrirArchivo(m: MaterialEstudiante): void {
    const ext = this.extension(m);
    const esVisible = this.extensionesVisibles.includes(ext);
    const modo = esVisible ? 'ver' : 'descargar';

    const ventana = esVisible ? window.open('', '_blank') : null;

    this.http.get(`${environment.apiUrl}/material/${m.id_material}/descargar?modo=${modo}`, {
      responseType: 'blob',
    }).subscribe({
      next: (blob) => {
        const tipoBlob = new Blob([blob], { type: blob.type || this.mimePorExtension(ext) });
        const url = window.URL.createObjectURL(tipoBlob);

        if (esVisible) {
          if (ventana) {
            ventana.location.href = url;
          } else {
            this.error.set('El navegador bloqueó la ventana emergente. Habilita los pop-ups para ver el archivo.');
          }
          setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
        } else {
          const a = document.createElement('a');
          a.href = url;
          a.download = `${m.titulo}.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      },
      error: () => {
        ventana?.close();
        this.error.set('No se pudo abrir el archivo.');
      },
    });
  }

  descargarDirecto(m: MaterialEstudiante, event: Event): void {
    event.stopPropagation();
    const ext = this.extension(m);
    this.http.get(`${environment.apiUrl}/material/${m.id_material}/descargar?modo=descargar`, {
      responseType: 'blob',
    }).subscribe({
      next: (blob) => {
        const tipoBlob = new Blob([blob], { type: blob.type || this.mimePorExtension(ext) });
        const url = window.URL.createObjectURL(tipoBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${m.titulo}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => this.error.set('No se pudo descargar el archivo.'),
    });
  }

  trackByMaterial(_: number, m: MaterialEstudiante): number {
    return m.id_material;
  }
}