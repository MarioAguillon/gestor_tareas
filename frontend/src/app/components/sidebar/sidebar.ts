import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Tarjeta } from '../tarjeta/tarjeta'; // <--- IMPORTA AQUÍ

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
  // Entramos a 'img', luego a 'avatar' y buscamos la foto
  return 'img/avatar/' + this.usuario.avatar;
}

  alSeleccionarUsuario() {
    this.seleccionar.emit(this.usuario.id);
  }
}