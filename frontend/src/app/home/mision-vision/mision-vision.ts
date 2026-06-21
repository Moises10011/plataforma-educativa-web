import { Component, OnInit, signal } from '@angular/core';
import { InstitucionService } from '../../core/services/institucion.service';
import { Institucion } from '../../core/models/institucion.model';

@Component({
  selector: 'app-mision-vision',
  imports: [],
  templateUrl: './mision-vision.html',
  styleUrl: './mision-vision.css',
})
export class MisionVision implements OnInit {
  institucion: Institucion | null = null;
  misionAbierta = signal(false);
  visionAbierta = signal(false);

  constructor(private institucionService: InstitucionService) {}

  ngOnInit(): void {
    this.institucionService.obtener().subscribe({
      next: (data) => {
        this.institucion = data;
      },
    });
  }

  toggleMision(): void {
    this.misionAbierta.set(!this.misionAbierta());
  }

  toggleVision(): void {
    this.visionAbierta.set(!this.visionAbierta());
  }
}