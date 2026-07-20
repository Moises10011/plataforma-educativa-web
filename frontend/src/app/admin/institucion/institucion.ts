import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Institucion {
  id_institucion?: number;
  nombre: string;
  director: string;
  direccion: string;
  telefono: string;
  correo: string;
  mision: string;
  vision: string;
  logo?: string;
}

@Component({
  selector: 'app-admin-institucion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './institucion.html',
  styleUrl: './institucion.css',
})
export class AdminInstitucion implements OnInit {
  institucion = signal<Institucion | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  guardadoOk = signal(false);
  error = signal('');
  logoFile: File | null = null;

  form: Institucion = {
    nombre: '', director: '', direccion: '', telefono: '',
    correo: '', mision: '', vision: '',
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Institucion>(`${environment.apiUrl}/institucion`).subscribe({
      next: (data) => {
        this.institucion.set(data);
        this.form = { ...data };
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.logoFile = input.files?.[0] ?? null;
  }

  guardar(): void {
    this.error.set('');
    this.guardando.set(true);
    const fd = new FormData();
    Object.entries(this.form).forEach(([k, v]) => { if (v) fd.append(k, String(v)); });
    if (this.logoFile) fd.append('logo', this.logoFile);

    this.http.put(`${environment.apiUrl}/institucion`, fd).subscribe({
      next: (data: any) => {
        this.institucion.set(data);
        this.guardando.set(false);
        this.guardadoOk.set(true);
        setTimeout(() => this.guardadoOk.set(false), 3000);
      },
      error: () => { this.guardando.set(false); this.error.set('Error al guardar'); },
    });
  }

  logoUrl(): string {
    const logo = this.institucion()?.logo;
    return logo ? `${environment.apiUrl}/uploads/institucion/${logo}` : '';
  }
}