import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-recuperar-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './recuperar-password.html',
  styleUrl: './recuperar-password.css',
})
export class RecuperarPassword {
  correo = '';
  cargando = signal(false);
  error = signal('');
  enviado = signal(false);

  constructor(private authService: AuthService) {}

  onSubmit(): void {
    if (!this.correo) {
      this.error.set('Ingresa tu correo electronico');
      return;
    }

    this.cargando.set(true);
    this.error.set('');

    this.authService.forgotPassword({ correo: this.correo }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.enviado.set(true);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('Ocurrio un error, intenta de nuevo');
      },
    });
  }
}