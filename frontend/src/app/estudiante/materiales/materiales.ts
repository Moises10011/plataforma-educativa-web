import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
 
interface Material {
  id_material: number;
  titulo: string;
  descripcion?: string;
  url_archivo: string;
  fecha_publicacion: string;
  curso: { nombre: string };
}
 
@Component({
  selector: 'app-estudiante-materiales',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './materiales.html',
  styleUrl: './materiales.css',
})
export class EstudianteMateriales implements OnInit {
  materiales = signal<Material[]>([]);
  cargando = signal(true);
 
  constructor(private http: HttpClient) {}
 
  ngOnInit(): void {
    this.http
      .get<Material[]>(`${environment.apiUrl}/material/estudiante/mis-materiales`)
      .subscribe({
        next: (data) => { this.materiales.set(data); this.cargando.set(false); },
        error: () => this.cargando.set(false),
      });
  }
}