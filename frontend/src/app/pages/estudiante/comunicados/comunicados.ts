import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-comunicados',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comunicados.html',
  styleUrl: './comunicados.css'
})
export class Comunicados implements OnInit {
  private http = inject(HttpClient);
  comunicados = signal<any[]>([]);

  ngOnInit(): void {
    // Petición al endpoint del backend
    this.http.get<any[]>('http://localhost:3000/comunicado').subscribe({
      next: (data) => {
        // Mapeamos los datos para añadirle el tipo visual según palabras del título
        const datosConTipo = data.map(c => {
          let tipo = 'informativo'; // Azul por defecto
          const t = c.titulo.toLowerCase();
          
          if (t.includes('reunión') || t.includes('suspensión') || t.includes('feriado')) {
            tipo = 'importante'; // Rojo
          } else if (t.includes('padre') || t.includes('actividades') || t.includes('evento')) {
            tipo = 'evento'; // Morado
          }
          
          return { ...c, tipo };
        });

        this.comunicados.set(datosConTipo);
      },
      error: (err) => console.error('Error al cargar comunicados desde el panel:', err)
    });
  }
}