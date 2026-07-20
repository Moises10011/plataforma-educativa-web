import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="acceso-denegado-container">
      <div class="card">
        <div class="icono">
          <svg class="w-20 h-20 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        
        <h1>Acceso Denegado</h1>
        
        <div class="mensaje" *ngIf="mensaje">
          {{ mensaje }}
        </div>

        <div class="info-adicional">
          <p>Por favor, contacta al administrador del sistema para más información.</p>
        </div>

        <div class="acciones">
          <button class="btn btn-primary" (click)="irAlLogin()">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .acceso-denegado-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .card {
      background: white;
      border-radius: 1rem;
      padding: 3rem;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .icono {
      margin-bottom: 1.5rem;
    }

    h1 {
      color: #1f2937;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
    }

    .mensaje {
      background: #fee2e2;
      color: #991b1b;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
      font-size: 1rem;
      line-height: 1.5;
    }

    .info-adicional {
      color: #6b7280;
      margin-bottom: 2rem;
      font-size: 0.875rem;
    }

    .acciones {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    @media (max-width: 640px) {
      .card {
        padding: 2rem 1.5rem;
      }

      h1 {
        font-size: 1.5rem;
      }

      .acciones {
        flex-direction: column;
      }
    }
  `]
})
export class AccesoDenegadoComponent {
  mensaje: string | null = null;

  constructor(private router: Router) {
    // Obtener mensaje de error de los query params
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['mensaje']) {
      this.mensaje = navigation.extras.state['mensaje'];
    } else {
      this.mensaje = 'No tienes permiso para acceder a esta página.';
    }
  }

  irAlLogin(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }
}