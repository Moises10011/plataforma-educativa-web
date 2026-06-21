import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, UsuarioAutenticado } from '../models/auth.model';
import {
  ForgotPasswordRequest,
  ResetPasswordRequest,
  MensajeRespuesta,
} from '../models/recuperar-password.model';

const CLAVE_TOKEN = 'plataforma_token';
const CLAVE_USUARIO = 'plataforma_usuario';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly esNavegador = isPlatformBrowser(inject(PLATFORM_ID));
  usuarioActual = signal<UsuarioAutenticado | null>(this.leerUsuarioGuardado());

  constructor(private http: HttpClient) {}

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credenciales).pipe(
      tap((respuesta) => {
        this.guardarSesion(respuesta);
      }),
    );
  }

  forgotPassword(datos: ForgotPasswordRequest): Observable<MensajeRespuesta> {
    return this.http.post<MensajeRespuesta>(`${this.apiUrl}/forgot-password`, datos);
  }

  resetPassword(datos: ResetPasswordRequest): Observable<MensajeRespuesta> {
    return this.http.post<MensajeRespuesta>(`${this.apiUrl}/reset-password`, datos);
  }

  logout(): void {
    if (!this.esNavegador) return;
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    this.usuarioActual.set(null);
  }

  obtenerToken(): string | null {
    if (!this.esNavegador) return null;
    return localStorage.getItem(CLAVE_TOKEN);
  }

  estaLogueado(): boolean {
    return !!this.obtenerToken();
  }

  tieneRol(rol: string): boolean {
    return this.usuarioActual()?.roles.includes(rol) ?? false;
  }

  private guardarSesion(respuesta: LoginResponse): void {
    if (!this.esNavegador) return;
    localStorage.setItem(CLAVE_TOKEN, respuesta.access_token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
    this.usuarioActual.set(respuesta.usuario);
  }

  private leerUsuarioGuardado(): UsuarioAutenticado | null {
    if (!this.esNavegador) return null;
    const datos = localStorage.getItem(CLAVE_USUARIO);
    return datos ? (JSON.parse(datos) as UsuarioAutenticado) : null;
  }
}