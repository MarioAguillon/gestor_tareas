export interface Tarea {
  id: string;
  idUsuario: string;
  titulo: string;
  resumen: string;
  expira: string;
  completada: number; // 0 para pendiente, 1 para terminada
}

export interface NuevaTareaInfo {
  titulo: string;
  resumen: string;
  fecha: string;
}