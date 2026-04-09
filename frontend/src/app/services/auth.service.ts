import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface LoginResponse {
  mensaje: string;
  token: string;
  nombre_usuario: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'tarea_facil_token';
  private readonly USER_KEY = 'tarea_facil_usuario';
  private readonly apiUrl = 'http://localhost:3000/auth';

  // Estado reactivo de sesión — se hidrata desde localStorage
  private _isLoggedIn$ = new BehaviorSubject<boolean>(this.hayTokenValido());
  readonly isLoggedIn$ = this._isLoggedIn$.asObservable();

  private _nombreAdmin$ = new BehaviorSubject<string>(
    localStorage.getItem(this.USER_KEY) ?? ''
  );
  readonly nombreAdmin$ = this._nombreAdmin$.asObservable();

  constructor(private http: HttpClient) {}

  /** Verifica que exista token en localStorage */
  private hayTokenValido(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  /** Retorna el token JWT almacenado o null */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** POST /auth/login → guarda token y emite estado */
  login(nombre_usuario: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { nombre_usuario, password }).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, res.nombre_usuario);
        this._isLoggedIn$.next(true);
        this._nombreAdmin$.next(res.nombre_usuario);
      })
    );
  }

  /** Limpia la sesión y emite estado falso */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._isLoggedIn$.next(false);
    this._nombreAdmin$.next('');
  }

  /** POST /auth/register → Crea un nuevo administrador */
  registrarAdmin(nombre_usuario: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, { nombre_usuario, password });
  }

  /** PUT /auth/perfil → Edita el perfil del admistrador actual */
  editarPerfil(nombre_usuario?: string, password?: string): Observable<any> {
    const body: any = {};
    if (nombre_usuario) body.nombre_usuario = nombre_usuario;
    if (password) body.password = password;

    return this.http.put(`${this.apiUrl}/perfil`, body).pipe(
      tap(() => {
        // Actualizar el estado local si el nombre de usuario cambió
        if (nombre_usuario) {
          localStorage.setItem(this.USER_KEY, nombre_usuario);
          this._nombreAdmin$.next(nombre_usuario);
        }
      })
    );
  }

  /** GET /auth/admins → Obtiene la lista de administradores */
  getAdmins(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admins`);
  }

  /** DELETE /auth/admins/:id → Elimina un administrador */
  eliminarAdmin(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admins/${id}`);
  }
}
