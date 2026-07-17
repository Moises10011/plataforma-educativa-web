import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
 
interface Comunicado {
  id_comunicado: number;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
  autor: { nombres: string; apellidos: string };
}
 
@Component({
  selector: 'app-estudiante-comunicados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comunicados.html',
  styleUrl: './comunicados.css',
})
export class EstudianteComunicados implements OnInit {
  comunicados = signal<Comunicado[]>([]);
  cargando = signal(true);
  seleccionado = signal<Comunicado | null>(null);
 
  constructor(private http: HttpClient) {}
 
  ngOnInit(): void {
    this.http
      .get<Comunicado[]>(`${environment.apiUrl}/comunicado`)
      .subscribe({
        next: (data) => { this.comunicados.set(data); this.cargando.set(false); },
        error: (error) => {
          console.error('Error al cargar comunicados:', error);
          this.cargando.set(false);
        },
      });
  }
  
  seleccionar(c: Comunicado): void {
    this.seleccionado.set(this.seleccionado()?.id_comunicado === c.id_comunicado ? null : c);
  }

  get totalComunicados(): number {
    return this.comunicados().length;
  }

  get comunicadosNoLeidos(): number {
    // Asumimos que los comunicados no leídos son aquellos que no están seleccionados
    const seleccionadoId = this.seleccionado()?.id_comunicado;
    if (!seleccionadoId) return this.comunicados().length;
    return this.comunicados().filter(c => c.id_comunicado !== seleccionadoId).length;
  }

  get comunicadoMasReciente(): Comunicado | null {
    if (this.comunicados().length === 0) return null;
    
    return this.comunicados().reduce((masReciente, comunicado) => {
      const fechaComunicado = new Date(comunicado.fecha_publicacion);
      const fechaMasReciente = new Date(masReciente.fecha_publicacion);
      return fechaComunicado > fechaMasReciente ? comunicado : masReciente;
    });
  }

  get autoresUnicos(): string[] {
    const autores = this.comunicados().map(c => `${c.autor.nombres} ${c.autor.apellidos}`);
    return [...new Set(autores)];
  }
}