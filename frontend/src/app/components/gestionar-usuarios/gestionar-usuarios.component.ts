import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuariosService, Usuario } from '../../services/usuarios.service';
import { ModalUsuarioComponent } from '../modal-usuario/modal-usuario.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-gestionar-usuarios',
  standalone: true,
  imports: [CommonModule, ModalUsuarioComponent],
  templateUrl: './gestionar-usuarios.component.html',
  styleUrls: ['./gestionar-usuarios.component.scss']
})
export class GestionarUsuariosComponent implements OnInit {
  private usuariosService = inject(UsuariosService);
  
  // Expose the signal to the template
  usuarios = this.usuariosService.usuarios;
  
  isLoading = true;
  modalVisible = false;
  usuarioEditando: Usuario | null = null;
  mensajeToast: string | null = null;

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.isLoading = true;
    this.usuariosService.cargarUsuarios().subscribe({
      next: () => this.isLoading = false,
      error: (err) => {
        this.isLoading = false;
        this.mostrarToast(err.message || 'Error al cargar los usuarios. Intenta de nuevo.');
      }
    });
  }

  abrirModalNuevo() {
    this.usuarioEditando = null;
    this.modalVisible = true;
  }

  abrirModalEditar(usuario: Usuario) {
    this.usuarioEditando = usuario;
    this.modalVisible = true;
  }

  cerrarModal() {
    this.modalVisible = false;
    this.usuarioEditando = null;
  }

  guardarUsuario(usuario: Usuario) {
    if (this.usuarioEditando) {
      this.usuariosService.editarUsuario(usuario.id, { nombre: usuario.nombre, avatar: usuario.avatar }).subscribe({
        next: () => {
          this.mostrarToast('Usuario actualizado correctamente');
          this.cerrarModal();
        },
        error: (err) => this.mostrarToast(err.message)
      });
    } else {
      this.usuariosService.crearUsuario(usuario).subscribe({
        next: () => {
          this.mostrarToast('Usuario creado correctamente');
          this.cerrarModal();
        },
        error: (err) => this.mostrarToast(err.message)
      });
    }
  }

  eliminarUsuario(usuario: Usuario) {
    if (confirm(`¿Estás seguro de eliminar a ${usuario.nombre} y todas sus tareas? Esta acción no se puede deshacer.`)) {
      this.usuariosService.eliminarUsuario(usuario.id).subscribe({
        next: () => this.mostrarToast('Usuario eliminado correctamente'),
        error: (err) => this.mostrarToast(err.message || 'Error al eliminar usuario. Verifica los datos.')
      });
    }
  }

  mostrarToast(mensaje: string) {
    this.mensajeToast = mensaje;
    setTimeout(() => this.mensajeToast = null, 4000);
  }

  getAvatarPath(avatar: string, nombre: string): string {
    if (avatar && avatar.startsWith('http')) return avatar;
    if (avatar) return `${environment.apiUrl}/public/avatars/${avatar}`;
    return this.getFallbackAvatar(nombre);
  }

  getFallbackAvatar(nombre: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nombre || 'Usuario')}&background=1565C0&color=fff&size=200`;
  }
}
