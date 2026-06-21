import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Galeria } from '../models/galeria.model';

@Injectable({
  providedIn: 'root',
})
export class GaleriaService {
  private readonly apiUrl = `${environment.apiUrl}/galeria`;

  constructor(private http: HttpClient) {}

  findAll(tipo?: string): Observable<Galeria[]> {
    const url = tipo ? `${this.apiUrl}?tipo=${tipo}` : this.apiUrl;
    return this.http.get<Galeria[]>(url);
  }

  obtenerUrlImagen(id: number): string {
    return `${this.apiUrl}/${id}/imagen`;
  }
}