import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { InstitucionService } from '../../../core/services/institucion.service';
import { Institucion } from '../../../core/models/institucion.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  institucion: Institucion | null = null;
  menuAbierto = false;

  constructor(
    private institucionService: InstitucionService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.institucionService.obtener().subscribe({
      next: (data) => {
        this.institucion = data;
      },
    });
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  obtenerUrlLogo(): string {
    return `${environment.apiUrl}/uploads/institucion/${this.institucion?.logo}`;
  }

  irALogin(): void {
    this.router.navigate(['/login']);
    this.menuAbierto = false;
  }
}