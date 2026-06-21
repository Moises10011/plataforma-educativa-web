export interface LoginRequest {
  correo: string;
  password: string;
}

export interface UsuarioAutenticado {
  id_usuario: number;
  nombres: string;
  correo: string;
  roles: string[];
}

export interface LoginResponse {
  access_token: string;
  usuario: UsuarioAutenticado;
}