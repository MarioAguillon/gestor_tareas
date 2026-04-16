import { Component, signal, inject, OnInit } from '@angular/core';
import { Header } from './components/header/header';
import { Sidebar } from './components/sidebar/sidebar';
import { MainContentComponent } from './components/main-content/main-content';
import { GestionarUsuariosComponent } from './components/gestionar-usuarios/gestionar-usuarios.component';
import { UsuariosService } from './services/usuarios.service';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Header, Sidebar, MainContentComponent, GestionarUsuariosComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('Administrador de Evidencias');
  
  private usuariosService = inject(UsuariosService);
  usuarios = this.usuariosService.usuarios;

  idUsuarioSeleccionado?: string;
  
  // Track current visual mode
  viewMode = signal<'TAREAS' | 'USUARIOS'>('TAREAS');

  ngOnInit() {
    this.usuariosService.cargarUsuarios().subscribe();
  }

  get usuarioSeleccionado() {
    return this.usuarios().find((usuario: any) => usuario.id === this.idUsuarioSeleccionado);
  }

  alSeleccionarUsuario(id: string) {
    this.idUsuarioSeleccionado = id;
  }

  /** Se llama cuando el admin hace click en el logo del header (RF-C) o cambia de tab */
  alLimpiarSeleccion() {
    this.idUsuarioSeleccionado = undefined;
    this.viewMode.set('TAREAS');
  }

  cambiarVista(vista: 'TAREAS' | 'USUARIOS') {
    this.viewMode.set(vista);
    if (vista === 'USUARIOS') {
      this.idUsuarioSeleccionado = undefined;
    }
  }
}