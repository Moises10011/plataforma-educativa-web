import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Institucion } from '../models/institucion.model';

@Injectable({
  providedIn: 'root',
})
export class InstitucionService {
  private readonly apiUrl = `${environment.apiUrl}/institucion`;

  constructor(private http: HttpClient) {}

  obtener(): Observable<Institucion> {
    return this.http.get<Institucion>(this.apiUrl);
  }
}