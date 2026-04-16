import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Usuario {
  id: string;
  nombre: string;
  avatar: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/usuarios`;

  // RF-07: Angular Signals reactivity
  private _usuarios = signal<Usuario[]>([]);
  public usuarios = this._usuarios.asReadonly();

  // Load all users from backend to hydrate the signal
  cargarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl).pipe(
      tap((data: Usuario[]) => {
        this._usuarios.set(data);
      }),
      catchError(err => {
        console.error('Error fetching users API', err);
        return throwError(() => new Error('Error al cargar los usuarios. Intenta de nuevo.'));
      })
    );
  }

  crearUsuario(usuario: Usuario): Observable<any> {
    return this.http.post(this.apiUrl, usuario).pipe(
      tap(() => {
        this._usuarios.update(list => [...list, usuario]);
      }),
      catchError(err => throwError(() => new Error('Error al guardar el usuario. Verifica los datos.')))
    );
  }

  editarUsuario(id: string, cambios: Partial<Usuario>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, cambios).pipe(
      tap(() => {
        this._usuarios.update(list => list.map(u => u.id === id ? { ...u, ...cambios } : u));
      }),
      catchError(err => throwError(() => new Error('Error al guardar el usuario. Verifica los datos.')))
    );
  }

  eliminarUsuario(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this._usuarios.update(list => list.filter(u => u.id !== id));
      }),
      catchError(err => throwError(() => new Error('Error al eliminar usuario. Verifica los datos.')))
    );
  }
}
