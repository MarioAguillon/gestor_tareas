import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TareasService } from '../../services/tareas.service';

@Component({
  selector: 'app-nueva-tarea',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './nueva-tarea.html',
  styleUrl: './nueva-tarea.css',
})
export class NuevaTarea {
  @Input({ required: true }) idUsuario!: string;
  @Output() cerrar = new EventEmitter<void>();

  tituloIngresado = '';
  resumenIngresado = '';
  fechaIngresado = '';
  creando = false;
  errorCrear: string | null = null;

  private tareasService = inject(TareasService);

  alCancelar() {
    this.cerrar.emit();
  }

  alEnviar() {
    if (!this.tituloIngresado.trim() || !this.resumenIngresado.trim()) {
      this.errorCrear = 'El título y la descripción son requeridos.';
      return;
    }

    this.creando = true;
    this.errorCrear = null;

    this.tareasService
      .agregarTarea(
        {
          titulo: this.tituloIngresado,
          resumen: this.resumenIngresado,
          fecha: this.fechaIngresado,
        },
        this.idUsuario
      )
      .subscribe({
        next: () => {
          this.creando = false;
          this.cerrar.emit();
        },
        error: (err) => {
          this.creando = false;
          this.errorCrear = err.error?.error ?? 'Error al crear la tarea.';
        },
      });
  }
}