import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-horarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './horarios.html',
  styleUrl: './horarios.css'
})
export class Horarios implements OnInit {
  private http = inject(HttpClient);
  
  dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  bloquesHorarios = signal<any[]>([]);

  ngOnInit(): void {
    const idGrado = 1;
    this.http.get<any[]>(`http://localhost:3000/horario/grado/${idGrado}`).subscribe({
      next: (data) => {
        this.bloquesHorarios.set(this.procesarHorarioBD(data));
      },
      error: (err) => console.error(err)
    });
  }

  private procesarHorarioBD(datosBD: any[]): any[] {
    const bloquesDefinidos: any[] = [
      { hora: '08:00:00 - 09:30:00', label: '08:00 AM - 09:30 AM', Lunes: '-', Martes: '-', Miercoles: '-', Jueves: '-', Viernes: '-' },
      { hora: '09:30:00 - 11:00:00', label: '09:30 AM - 11:00 AM', Lunes: '-', Martes: '-', Miercoles: '-', Jueves: '-', Viernes: '-' },
      { hora: '11:00:00 - 11:30:00', label: '11:00 AM - 11:30 AM', Lunes: 'RECREO', Martes: 'RECREO', Miercoles: 'RECREO', Jueves: 'RECREO', Viernes: 'RECREO' },
      { hora: '11:30:00 - 13:00:00', label: '11:30 AM - 01:00 PM', Lunes: '-', Martes: '-', Miercoles: '-', Jueves: '-', Viernes: '-' }
    ];

    datosBD.forEach(item => {
      const rangoItem = `${item.hora_inicio} - ${item.hora_fin}`;
      const bloqueEncontrado = bloquesDefinidos.find(b => b.hora === rangoItem);
      if (bloqueEncontrado) {
        
        const dia = item.dia_semana === 'Miércoles' ? 'Miercoles' : item.dia_semana;
        bloqueEncontrado[dia] = item.asignacion?.curso?.nombre || 'Materia';
      }
    });

    return bloquesDefinidos;
  }
}