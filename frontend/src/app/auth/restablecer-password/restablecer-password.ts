import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-restablecer-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './restablecer-password.html',
  styleUrl: './restablecer-password.css',
})
export class RestablecerPassword implements OnInit {
  token = '';
  password = '';
  confirmarPassword = '';
  mostrarPassword = signal(false);
  cargando = signal(false);
  error = signal('');
  exito = signal(false);
  tokenValido = signal(true);

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const tokenUrl = this.route.snapshot.queryParamMap.get('token');

    if (!tokenUrl) {
      this.tokenValido.set(false);
      return;
    }

    this.token = tokenUrl;
  }

  toggleMostrarPassword(): void {
    this.mostrarPassword.set(!this.mostrarPassword());
  }

  onSubmit(): void {
    if (!this.password || !this.confirmarPassword) {
      this.error.set('Completa todos los campos');
      return;
    }

    if (this.password.length < 6) {
      this.error.set('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    if (this.password !== this.confirmarPassword) {
      this.error.set('Las contrasenas no coinciden');
      return;
    }

    this.cargando.set(true);
    this.error.set('');

    this.authService.resetPassword({ token: this.token, password: this.password }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.exito.set(true);
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('El enlace es invalido o ha expirado. Solicita uno nuevo.');
      },
    });
  }
}