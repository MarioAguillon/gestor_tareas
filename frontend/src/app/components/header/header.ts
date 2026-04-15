import { Component, ChangeDetectorRef, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  @Output() limpiarSeleccion = new EventEmitter<void>();

  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);

  isLoggedIn$ = this.authService.isLoggedIn$;
  nombreAdmin$ = this.authService.nombreAdmin$;

  // Login
  loginForm!: FormGroup;
  errorLogin: string | null = null;
  cargando = false;
  mostrarLogin = false;

  // Paneles administrativos (Crear / Editar / Eliminar)
  mostrarOpcionesAdmin = false;
  
  mostrarCrearAdmin = false;
  crearAdminForm!: FormGroup;
  errorCrearAdmin: string | null = null;
  exitoCrearAdmin: string | null = null;
  cargandoCrear = false;

  mostrarEditarPerfil = false;
  editarPerfilForm!: FormGroup;
  errorEditarPerfil: string | null = null;
  exitoEditarPerfil: string | null = null;
  cargandoEditar = false;

  mostrarGestionarAdmins = false;
  listaAdmins: any[] = [];
  errorGestion: string | null = null;
  exitoGestion: string | null = null;
  cargandoGestion = false;

  adminEditandoId: number | null = null;
  editarOtroAdminForm!: FormGroup;

  ngOnInit() {
    this.loginForm = this.fb.group({
      nombre_usuario: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.crearAdminForm = this.fb.group({
      nombre_usuario: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.editarPerfilForm = this.fb.group({
      nombre_usuario: ['', [Validators.minLength(3)]],
      password: ['', [Validators.minLength(6)]]
    });

    this.editarOtroAdminForm = this.fb.group({
      nombre_usuario: ['', [Validators.minLength(3)]],
      password: ['', [Validators.minLength(6)]]
    });
  }

  alClickLogo() {
    this.limpiarSeleccion.emit();
  }

  // --- LOGIN ---
  toggleLogin() {
    this.mostrarLogin = !this.mostrarLogin;
    this.errorLogin = null;
    this.loginForm.reset();
  }

  alIniciarSesion() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.errorLogin = null;
    const { nombre_usuario, password } = this.loginForm.value;

    this.authService.login(nombre_usuario, password).subscribe({
      next: () => {
        this.cargando = false;
        this.mostrarLogin = false;
        this.loginForm.reset();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargando = false;
        this.errorLogin = err.error?.error ?? 'Error al iniciar sesión.';
        this.cdr.markForCheck();
      },
    });
  }

  alCerrarSesion() {
    this.authService.logout();
    this.limpiarSeleccion.emit();
    this.mostrarOpcionesAdmin = false;
    this.cdr.markForCheck();
  }

  // --- MENÚ ADMIN ---
  toggleOpcionesAdmin() {
    this.mostrarOpcionesAdmin = !this.mostrarOpcionesAdmin;
  }

  // --- CREAR ADMIN ---
  abrirCrearAdmin() {
    this.mostrarOpcionesAdmin = false;
    this.mostrarCrearAdmin = true;
    this.errorCrearAdmin = null;
    this.exitoCrearAdmin = null;
    this.crearAdminForm.reset();
  }

  cerrarCrearAdmin() {
    this.mostrarCrearAdmin = false;
  }

  alCrearAdmin() {
    if (this.crearAdminForm.invalid) {
      this.crearAdminForm.markAllAsTouched();
      return;
    }
    this.cargandoCrear = true;
    this.errorCrearAdmin = null;
    this.exitoCrearAdmin = null;

    const { nombre_usuario, password } = this.crearAdminForm.value;
    
    this.authService.registrarAdmin(nombre_usuario, password).subscribe({
      next: () => {
        this.cargandoCrear = false;
        this.exitoCrearAdmin = 'Administrador creado con éxito.';
        this.crearAdminForm.reset();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargandoCrear = false;
        this.errorCrearAdmin = err.error?.error ?? 'Error al crear administrador.';
        this.cdr.markForCheck();
      }
    });
  }

  // --- EDITAR PERFIL ---
  abrirEditarPerfil() {
    this.mostrarOpcionesAdmin = false;
    this.mostrarEditarPerfil = true;
    this.errorEditarPerfil = null;
    this.exitoEditarPerfil = null;
    this.editarPerfilForm.reset();
  }

  cerrarEditarPerfil() {
    this.mostrarEditarPerfil = false;
  }

  alEditarPerfil() {
    const { nombre_usuario, password } = this.editarPerfilForm.value;
    
    if (!nombre_usuario && !password) {
      this.errorEditarPerfil = 'Debes llenar al menos un campo para actualizar.';
      return;
    }

    if (this.editarPerfilForm.invalid) {
      this.editarPerfilForm.markAllAsTouched();
      return;
    }

    this.cargandoEditar = true;
    this.errorEditarPerfil = null;
    this.exitoEditarPerfil = null;

    this.authService.editarPerfil(nombre_usuario, password).subscribe({
      next: () => {
        this.cargandoEditar = false;
        this.exitoEditarPerfil = 'Perfil actualizado con éxito.';
        this.editarPerfilForm.reset();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.cargandoEditar = false;
        this.errorEditarPerfil = err.error?.error ?? 'Error al actualizar perfil.';
        this.cdr.markForCheck();
      }
    });
  }

  // --- GESTIONAR ADMINS ---
  abrirGestionarAdmins() {
    this.mostrarOpcionesAdmin = false;
    this.mostrarGestionarAdmins = true;
    this.errorGestion = null;
    this.exitoGestion = null;
    this.adminEditandoId = null;
    this.cargarListaAdmins();
  }

  cerrarGestionarAdmins() {
    this.mostrarGestionarAdmins = false;
    this.adminEditandoId = null;
  }

  cargarListaAdmins() {
    this.cargandoGestion = true;
    this.authService.getAdmins().subscribe({
      next: (admins) => {
        this.listaAdmins = admins;
        this.cargandoGestion = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorGestion = 'No se pudo cargar la lista de administradores.';
        this.cargandoGestion = false;
        this.cdr.markForCheck();
      }
    });
  }

  alEliminarAdmin(id: number) {
    if (!confirm('¿Estás seguro de que deseas eliminar a este administrador?')) return;
    
    this.errorGestion = null;
    this.exitoGestion = null;

    this.authService.eliminarAdmin(id).subscribe({
      next: () => {
        this.exitoGestion = 'Administrador eliminado con éxito.';
        this.cargarListaAdmins(); // Recargar lista
      },
      error: (err) => {
        this.errorGestion = err.error?.error ?? 'Error al eliminar administrador.';
        this.cdr.markForCheck();
      }
    });
  }

  iniciarEdicionOtroAdmin(admin: any) {
    this.adminEditandoId = admin.id;
    this.editarOtroAdminForm.patchValue({ nombre_usuario: admin.nombre_usuario, password: '' });
    this.errorGestion = null;
    this.exitoGestion = null;
  }

  cancelarEdicionOtroAdmin() {
    this.adminEditandoId = null;
    this.editarOtroAdminForm.reset();
  }

  guardarEdicionOtroAdmin() {
    if (!this.adminEditandoId) return;

    const { nombre_usuario, password } = this.editarOtroAdminForm.value;
    if (!nombre_usuario && !password) {
      this.errorGestion = 'Rellena un campo para actualizar.';
      return;
    }
    if (this.editarOtroAdminForm.invalid) {
      this.editarOtroAdminForm.markAllAsTouched();
      return;
    }

    this.cargandoGestion = true;
    this.errorGestion = null;
    this.exitoGestion = null;

    this.authService.editarAdmin(this.adminEditandoId, nombre_usuario, password).subscribe({
      next: () => {
        this.exitoGestion = 'Administrador modificado con éxito.';
        this.adminEditandoId = null;
        this.cargarListaAdmins();
      },
      error: (err) => {
        this.errorGestion = err.error?.error ?? 'Error al modificar administrador.';
        this.cargandoGestion = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Getters validación
  get campoUsuario() { return this.loginForm.get('nombre_usuario'); }
  get campoPassword() { return this.loginForm.get('password'); }
  
  get campoNuevoAdminUser() { return this.crearAdminForm.get('nombre_usuario'); }
  get campoNuevoAdminPass() { return this.crearAdminForm.get('password'); }
  
  get campoEdicionUser() { return this.editarPerfilForm.get('nombre_usuario'); }
  get campoEdicionPass() { return this.editarPerfilForm.get('password'); }
  
  get campoOtroAdminUser() { return this.editarOtroAdminForm.get('nombre_usuario'); }
  get campoOtroAdminPass() { return this.editarOtroAdminForm.get('password'); }
}