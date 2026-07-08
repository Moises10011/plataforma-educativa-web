import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface Comunicado {
  id_comunicado: number;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
  autor: { nombres: string; apellidos: string };
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

  trackByComunicado(_: number, c: Comunicado): number {
    return c.id_comunicado;
  }
}