import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
 
interface EstudianteDocente {
  id_usuario: number;
  nombres: string;
  apellidos: string;
  correo: string;
  estado: boolean;
}
 
@Component({
  selector: 'app-docente-estudiantes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estudiantes.html',
  styleUrl: './estudiantes.css',
})
export class DocenteEstudiantes implements OnInit {
  estudiantes = signal<EstudianteDocente[]>([]);
  cargando = signal(true);
 
  constructor(private http: HttpClient) {}
 
  ngOnInit(): void {
    this.http
      .get<EstudianteDocente[]>(`${environment.apiUrl}/usuario`)
      .subscribe({
        next: (data) => { this.estudiantes.set(data); this.cargando.set(false); },
        error: () => this.cargando.set(false),
      });
  }
}