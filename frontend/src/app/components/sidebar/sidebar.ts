import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Tarjeta } from '../tarjeta/tarjeta'; // <--- IMPORTA AQUÍ
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [Tarjeta], // <--- AÑADE AQUÍ
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  @Input({ required: true }) usuario!: { id: string; nombre: string; avatar: string };
  @Input({ required: true }) seleccionado!: boolean; // <--- ASEGÚRATE QUE SE LLAME ASÍ
  @Output() seleccionar = new EventEmitter<string>();

 get rutaImagen() {
  return `${environment.apiUrl}/public/avatars/${this.usuario.avatar}`;
}

  alSeleccionarUsuario() {
    this.seleccionar.emit(this.usuario.id);
  }
}