import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Tarea, NuevaTareaInfo } from '../components/tarea/tarea.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TareasService {
  private readonly url = `${environment.apiUrl}/tareas`;

  // Estado reactivo central de tareas
  private _tareas$ = new BehaviorSubject<Tarea[]>([]);
  readonly tareas$ = this._tareas$.asObservable();

  constructor(private http: HttpClient) {
    this.cargarTareas();
  }

  /** GET /tareas — público, carga todas las tareas y actualiza el BehaviorSubject */
  cargarTareas(): void {
    this.http.get<Tarea[]>(this.url).subscribe({
      next: (tareas) => this._tareas$.next(tareas),
      error: (err) => console.error('❌ Error al cargar tareas:', err),
    });
  }

  /** Filtra localmente las tareas del usuario seleccionado */
  obtenerTareasDeUsuario(idUsuario: string): Tarea[] {
    return this._tareas$.getValue().filter((t) => t.idUsuario === idUsuario);
  }

  /** POST /tareas — protegido, el interceptor inyecta el token */
  agregarTarea(info: NuevaTareaInfo, idUsuario: string): Observable<any> {
    const nueva = {
      id: new Date().getTime().toString(),
      idUsuario,
      titulo: info.titulo,
      resumen: info.resumen,
      expira: info.fecha,
    };
    return this.http.post(this.url, nueva).pipe(
      tap(() => this.cargarTareas())
    );
  }

  /** PUT /tareas/:id con body { completada: 1 } — protegido */
  completarTarea(id: string): Observable<any> {
    return this.http.put(`${this.url}/${id}`, { completada: 1 }).pipe(
      tap(() => this.cargarTareas())
    );
  }

  /** PUT /tareas/:id con datos editables — protegido (RF-D) */
  editarTarea(id: string, datos: Partial<Tarea>): Observable<any> {
    return this.http.put(`${this.url}/${id}`, datos);
    // La recarga la maneja el componente tras éxito (con markForCheck)
  }

  /** Actualiza una tarea localmente sin recargar desde el backend */
  actualizarTareaLocal(tareaActualizada: Tarea): void {
    const actuales = this._tareas$.getValue();
    const indice = actuales.findIndex((t) => t.id === tareaActualizada.id);
    if (indice !== -1) {
      actuales[indice] = tareaActualizada;
      this._tareas$.next([...actuales]); // nueva referencia para triggear el change detection
    }
  }

  /** DELETE /tareas/:id — protegido */
  eliminarTarea(id: string): Observable<any> {
    return this.http.delete(`${this.url}/${id}`).pipe(
      tap(() => this.cargarTareas())
    );
  }
}