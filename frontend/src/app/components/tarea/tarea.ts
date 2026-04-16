import {
  Component,
  Input,
  inject,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Tarea } from './tarea.model';
import { TareasService } from '../../services/tareas.service';
import { Tarjeta } from '../tarjeta/tarjeta';

@Component({
  selector: 'app-tarea',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Tarjeta, DatePipe],
  templateUrl: './tarea.html',
  styleUrl: './tarea.css',
})
export class TareaComponent implements OnInit {
  @Input({ required: true }) tarea!: Tarea;
  /** Controla visibilidad de botones CRUD — true solo cuando isLoggedIn$ === true */
  @Input() isAdmin = false;

  private tareasService = inject(TareasService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  // ── Estado del modal de edición ──
  mostrarModalEdicion = false;
  isGuardando = false;
  errorEdicion: string | null = null;

  editForm!: FormGroup;

  ngOnInit() {
    this.editForm = this.fb.group({
      titulo: [
        '',
        [Validators.required, Validators.minLength(3)],
      ],
      resumen: [
        '',
        [Validators.required, Validators.minLength(5)],
      ],
      expira: [''],
    });
  }

  // ── Botón "Terminar" ──
  alCompletarTarea() {
    this.tareasService.completarTarea(this.tarea.id).subscribe({
      error: (err) => console.error('Error al completar tarea:', err),
    });
  }

  // ── Botón "Reabrir" ──
  alReabrirTarea() {
    this.tareasService.editarTarea(this.tarea.id, { completada: 0 }).subscribe({
      next: () => {
        const tareaActualizada = { ...this.tarea, completada: 0 };
        this.tareasService.actualizarTareaLocal(tareaActualizada);
      },
      error: (err) => console.error('Error al reabrir tarea:', err),
    });
  }

  // ── Botón "Borrar" ──
  alBorrarTarea() {
    this.tareasService.eliminarTarea(this.tarea.id).subscribe({
      error: (err) => console.error('Error al eliminar tarea:', err),
    });
  }

  // ── Botón "Editar" → abre modal con datos pre-cargados ──
  alAbrirEdicion() {
    this.errorEdicion = null;
    this.editForm.patchValue({
      titulo: this.tarea.titulo,
      resumen: this.tarea.resumen,
      expira: this.tarea.expira ?? '',
    });
    this.mostrarModalEdicion = true;
  }

  alCerrarEdicion() {
    this.mostrarModalEdicion = false;
    this.errorEdicion = null;
    this.editForm.reset();
  }

  // ── Confirmar edición → PUT /tareas/:id ──
  alGuardarEdicion() {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    this.isGuardando = true;
    this.errorEdicion = null;

    const datos = {
      titulo: this.editForm.value.titulo.trim(),
      resumen: this.editForm.value.resumen.trim(),
      expira: this.editForm.value.expira,
    };

    this.tareasService.editarTarea(this.tarea.id, datos).subscribe({
      next: () => {
        // Actualizar estado local SIN recargar la página
        const tareaActualizada: Tarea = {
          ...this.tarea,
          titulo: datos.titulo,
          resumen: datos.resumen,
          expira: datos.expira,
        };
        this.tareasService.actualizarTareaLocal(tareaActualizada);

        this.isGuardando = false;
        this.mostrarModalEdicion = false;
        this.editForm.reset();
        this.cdr.markForCheck(); // ← forzar detección con withFetch()
      },
      error: (err) => {
        this.isGuardando = false;
        this.errorEdicion =
          err.error?.error ?? 'Error al guardar. Intenta de nuevo.';
        this.cdr.markForCheck(); // ← forzar detección con withFetch()
      },
    });
  }

  // Getters de validación para el template
  get campoTitulo() { return this.editForm.get('titulo'); }
  get campoResumen() { return this.editForm.get('resumen'); }
}