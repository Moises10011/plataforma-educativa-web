export interface ForgotPasswordRequest {
  correo: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface MensajeRespuesta {
  message: string;
}