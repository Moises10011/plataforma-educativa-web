import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
 
interface NotaDocente {
  id_nota: number;
  valor: number;
  descripcion?: string;
  estudiante: { nombres: string; apellidos: string };
  curso: { nombre: string };
}
 
@Component({
  selector: 'app-docente-notas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notas.html',
  styleUrl: './notas.css',
})
export class DocenteNotas implements OnInit {
  notas = signal<NotaDocente[]>([]);
  cargando = signal(true);
 
  constructor(private http: HttpClient) {}
 
  ngOnInit(): void {
    this.http
      .get<NotaDocente[]>(`${environment.apiUrl}/nota/docente/mis-notas`)
      .subscribe({
        next: (data) => { this.notas.set(data); this.cargando.set(false); },
        error: () => this.cargando.set(false),
      });
  }
 
  colorNota(valor: number): string {
    if (valor >= 14) return 'text-green-700 bg-green-100';
    if (valor >= 11) return 'text-amber-700 bg-amber-100';
    return 'text-red-700 bg-red-100';
  }
}