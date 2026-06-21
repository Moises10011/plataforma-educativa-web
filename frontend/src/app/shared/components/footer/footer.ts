import { Component, OnInit } from '@angular/core';
import { InstitucionService } from '../../../core/services/institucion.service';
import { Institucion } from '../../../core/models/institucion.model';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer implements OnInit {
  institucion: Institucion | null = null;
  anioActual = new Date().getFullYear();

  constructor(private institucionService: InstitucionService) {}

  ngOnInit(): void {
    this.institucionService.obtener().subscribe({
      next: (data) => {
        this.institucion = data;
      },
    });
  }
}