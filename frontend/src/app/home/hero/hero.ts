import { Component, OnInit } from '@angular/core';
import { GaleriaService } from '../../core/services/galeria';
import { InstitucionService } from '../../core/services/institucion.service';
import { Galeria } from '../../core/models/galeria.model';
import { Institucion } from '../../core/models/institucion.model';

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero implements OnInit {
  fotoFondo: Galeria | null = null;
  institucion: Institucion | null = null;

  constructor(
    private galeriaService: GaleriaService,
    private institucionService: InstitucionService,
  ) {}

  ngOnInit(): void {
    this.galeriaService.findAll('BANNER').subscribe({
      next: (data) => {
        this.fotoFondo = data.length > 0 ? data[0] : null;
      },
    });

    this.institucionService.obtener().subscribe({
      next: (data) => {
        this.institucion = data;
      },
    });
  }

  obtenerUrlImagen(id: number): string {
    return this.galeriaService.obtenerUrlImagen(id);
  }
}