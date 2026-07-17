export interface LoginRequest {
  correo: string;
  password: string;
}

export interface UsuarioAutenticado {
  id_usuario: number;
  nombres: string;
  correo: string;
  roles: string[];
  // Solo vienen con valor para usuarios con rol "Estudiante".
  // Para Administrador/Docente llegan null o undefined.
  grado?: string | number | null;
  seccion?: string | null;
}

export interface LoginResponse {
  access_token: string;
  usuario: UsuarioAutenticado;
}