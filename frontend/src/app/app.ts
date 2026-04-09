import { Component, signal } from '@angular/core';
import { Header } from './components/header/header';
import { Sidebar } from './components/sidebar/sidebar';
import { MainContentComponent } from './components/main-content/main-content';
import { USUARIOS_FALSOS } from './usuarios-falsos';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Header, Sidebar, MainContentComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Tarea Fácil - Davis');

  usuarios = USUARIOS_FALSOS;

  idUsuarioSeleccionado?: string;

  get usuarioSeleccionado() {
    return this.usuarios.find((usuario) => usuario.id === this.idUsuarioSeleccionado);
  }

  alSeleccionarUsuario(id: string) {
    this.idUsuarioSeleccionado = id;
  }

  /** Se llama cuando el admin hace click en el logo del header (RF-C) */
  alLimpiarSeleccion() {
    this.idUsuarioSeleccionado = undefined;
  }
}