import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { TareaComponent } from '../tarea/tarea';
import { NuevaTarea } from '../nueva-tarea/nueva-tarea';
import { TareasService } from '../../services/tareas.service';
import { AuthService } from '../../services/auth.service';
import { Tarea } from '../tarea/tarea.model';
import { Observable, Subscription, map } from 'rxjs';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [CommonModule, AsyncPipe, TareaComponent, NuevaTarea],
  templateUrl: './main-content.html',
  styleUrl: './main-content.css',
})
export class MainContentComponent implements OnInit, OnDestroy {
  @Input({ required: true }) idUsuario!: string;
  @Input({ required: true }) nombre!: string;

  estaAgregandoTareaNueva = false;
  cargando = true;

  private tareasService = inject(TareasService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  readonly isLoggedIn$ = this.authService.isLoggedIn$;

  tareas$!: Observable<Tarea[]>;

  // Suscripción separada para controlar el skeleton — evita el deadlock
  private cargandoSub!: Subscription;

  ngOnInit() {
    // Observable de tareas filtradas por idUsuario para el template
    this.tareas$ = this.tareasService.tareas$.pipe(
      map((tareas) => tareas.filter((t) => t.idUsuario === this.idUsuario))
    );

    // Suscripción independiente: cuando tareas$ emita (incluso vacío),
    // apagamos el skeleton. El BehaviorSubject emite de inmediato con [].
    this.cargandoSub = this.tareasService.tareas$.subscribe(() => {
      if (this.cargando) {
        this.cargando = false;
        this.cdr.markForCheck();
      }
    });
  }

  ngOnDestroy() {
    this.cargandoSub?.unsubscribe();
  }

  alIniciarNuevaTarea() {
    this.estaAgregandoTareaNueva = true;
  }

  alCerrarTareaNueva() {
    this.estaAgregandoTareaNueva = false;
  }
}