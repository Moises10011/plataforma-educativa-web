import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { InstitucionService } from '../../core/services/institucion.service';
import { GaleriaService } from '../../core/services/galeria';
import { Institucion } from '../../core/models/institucion.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  correo = '';
  password = '';
  mostrarPassword = signal(false);
  cargando = signal(false);
  error = signal('');

  institucion: Institucion | null = null;
  urlFondo: string | null = null;
  fondoCargado =false;

  constructor(
    private authService: AuthService,
    private institucionService: InstitucionService,
    private galeriaService: GaleriaService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.institucionService.obtener().subscribe({
      next: (data) => {
        this.institucion = data;
        this.cdr.detectChanges();
      },
    });

    this.galeriaService.findAll('BANNER').subscribe({
      next: (data) => {
        if (data.length > 0) {
          this.urlFondo = this.galeriaService.obtenerUrlImagen(data[0].id_galeria);
          this.cdr.detectChanges();
        }
      },
    });
  }

  onFondoCargado(): void {
    this.fondoCargado = true;
  }

  obtenerUrlLogo(): string {
    return `${environment.apiUrl}/uploads/institucion/${this.institucion?.logo}`;
  }

  toggleMostrarPassword(): void {
    this.mostrarPassword.set(!this.mostrarPassword());
  }

  onSubmit(): void {
    if (!this.correo || !this.password) {
      this.error.set('Completa todos los campos');
      return;
    }

    this.cargando.set(true);
    this.error.set('');

    this.authService.login({ correo: this.correo, password: this.password }).subscribe({
      next: () => {
        this.cargando.set(false);

        if (this.authService.tieneRol('Administrador')) {
          this.router.navigate(['/admin']);
        } else if (this.authService.tieneRol('Docente')) {
          this.router.navigate(['/docente']);
        } else if (this.authService.tieneRol('Estudiante')) {
          this.router.navigate(['/estudiante']);
        } else {
          this.error.set('Rol no autorizado o no reconocido');
        }
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('Correo o contrasena incorrectos');
      },
    });
  }
}