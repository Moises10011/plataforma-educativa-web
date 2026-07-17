import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface EstadisticasUsuarios {
  totalEstudiantes: number;
  totalDocentes: number;
}

interface DistribucionItem {
  nombre: string;
  cantidad: number;
}

interface GradoMini {
  id_grado: number;
  nombre: string;
}

interface SeccionMini {
  id_seccion: number;
  nombre: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  estadisticas = signal<EstadisticasUsuarios | null>(null);

  distribucionGrados = signal<DistribucionItem[]>([]);
  distribucionSecciones = signal<DistribucionItem[]>([]);

  cargando = signal(true);
  error = signal('');

  /** Controla el disparo de la animación de crecimiento de las barras */
  barrasListas = signal(false);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarEstadisticas();
    this.cargarDistribuciones();
  }

  private cargarEstadisticas(): void {
    this.http
      .get<EstadisticasUsuarios>(`${environment.apiUrl}/usuario/estadisticas/conteo`)
      .subscribe({
        next: (data) => {
          this.estadisticas.set(data);
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('Error al cargar estadísticas:', err);
          this.cargando.set(false);
          this.error.set('Error al cargar estadísticas');
        },
      });
  }

  private cargarDistribuciones(): void {
    this.http.get<GradoMini[]>(`${environment.apiUrl}/grado`).subscribe({
      next: (grados) => {
        this.http
          .get<DistribucionItem[]>(`${environment.apiUrl}/matricula/distribucion/grado`)
          .subscribe({
            next: (conteos) => this.armarDistribucionGrados(grados, conteos),
            error: () => this.armarDistribucionGrados(grados, []),
          });
      },
      error: (err) => {
        console.error('Error al cargar grados:', err);
        this.distribucionGrados.set([]);
      },
    });

    this.http.get<SeccionMini[]>(`${environment.apiUrl}/seccion`).subscribe({
      next: (secciones) => {
        this.http
          .get<DistribucionItem[]>(`${environment.apiUrl}/matricula/distribucion/seccion`)
          .subscribe({
            next: (conteos) => this.armarDistribucionSecciones(secciones, conteos),
            error: () => this.armarDistribucionSecciones(secciones, []),
          });
      },
      error: (err) => {
        console.error('Error al cargar secciones:', err);
        this.distribucionSecciones.set([]);
      },
    });
  }

  private numeroDe(nombre: string): number {
    const match = nombre.match(/\d+/);
    return match ? parseInt(match[0], 10) : 999;
  }

  private armarDistribucionGrados(grados: GradoMini[], conteos: DistribucionItem[]): void {
    const mapaConteos = new Map(conteos.map((c) => [c.nombre.trim().toLowerCase(), c.cantidad]));

    const resultado = grados
      .map((g) => ({
        nombre: g.nombre,
        cantidad: mapaConteos.get(g.nombre.trim().toLowerCase()) ?? 0,
      }))
      .sort((a, b) => this.numeroDe(a.nombre) - this.numeroDe(b.nombre));

    this.distribucionGrados.set(resultado);
    this.dispararAnimacion();
  }

  private armarDistribucionSecciones(secciones: SeccionMini[], conteos: DistribucionItem[]): void {
    const mapaConteos = new Map(conteos.map((c) => [c.nombre.trim().toLowerCase(), c.cantidad]));

    const resultado = secciones
      .map((s) => ({
        nombre: s.nombre,
        cantidad: mapaConteos.get(s.nombre.trim().toLowerCase()) ?? 0,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    this.distribucionSecciones.set(resultado);
    this.dispararAnimacion();
  }

  private dispararAnimacion(): void {
    this.barrasListas.set(false);
    setTimeout(() => this.barrasListas.set(true), 60);
  }

  obtenerMaximo(items: DistribucionItem[]): number {
    if (items.length === 0) return 0;
    return Math.max(...items.map((item) => item.cantidad), 1);
  }

  alturaBarra(cantidad: number, items: DistribucionItem[]): string {
    if (!this.barrasListas()) return '0px';
    if (cantidad === 0) return '6px';
    const maximo = this.obtenerMaximo(items);
    return `${Math.max((cantidad / maximo) * 260, 10)}px`;
  }

  totalEstudiantesEn(items: DistribucionItem[]): number {
    return items.reduce((acc, item) => acc + item.cantidad, 0);
  }
}