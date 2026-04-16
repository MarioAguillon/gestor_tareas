import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../services/usuarios.service';
import { AvatarService } from '../../services/avatar.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-modal-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-usuario.component.html',
  styleUrls: ['./modal-usuario.component.scss']
})
export class ModalUsuarioComponent implements OnInit {
  @Input() usuarioAEditar: Usuario | null = null;
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Usuario>();

  nombre = '';
  avatarSeleccionado = '';
  avataresDisponibles: string[] = [];
  
  private avatarService = inject(AvatarService);
  isLoadingAvatars = true;

  ngOnInit() {
    this.cargarAvatares();
    if (this.usuarioAEditar) {
      this.nombre = this.usuarioAEditar.nombre;
      this.avatarSeleccionado = this.usuarioAEditar.avatar;
    }
  }

  cargarAvatares() {
    this.avatarService.getAvatares().subscribe(avs => {
      this.avataresDisponibles = avs;
      this.isLoadingAvatars = false;
      if (!this.avatarSeleccionado && avs.length > 0) {
        this.avatarSeleccionado = avs[0];
      }
    });
  }

  getAvatarUrl(avatarId: string): string {
    if (avatarId && avatarId.startsWith('http')) return avatarId;
    return `${environment.apiUrl}/public/avatars/${avatarId}`;
  }
  
  getAvatarPath(avatar: string): string {
    if (avatar && avatar.startsWith('http')) return avatar;
    return `${environment.apiUrl}/public/avatars/${avatar}`;
  }

  seleccionarAvatar(avatar: string) {
    this.avatarSeleccionado = avatar;
  }

  guardar() {
    if (!this.nombre.trim()) return;
    
    // UUID generation simple
    const id = this.usuarioAEditar ? this.usuarioAEditar.id : crypto.randomUUID();
    
    const usuario: Usuario = {
      id: id,
      nombre: this.nombre,
      avatar: this.avatarSeleccionado
    };
    
    this.save.emit(usuario);
  }

  cancelar() {
    this.close.emit();
  }
}
