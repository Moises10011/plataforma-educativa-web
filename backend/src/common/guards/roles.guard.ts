import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

interface RequestWithUser {
  user?: {
    roles?: string[];
    id_usuario?: number;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay roles requeridos en el decorador, permitir acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();

    // Si no hay usuario en la request (JWT no validado previamente)
    if (!user) {
      throw new UnauthorizedException('No autenticado');
    }

    // Si el usuario no tiene roles
    if (!user.roles || user.roles.length === 0) {
      throw new ForbiddenException('El usuario no tiene roles asignados');
    }

    // Verificar si tiene al menos uno de los roles requeridos
    const tieneRol = requiredRoles.some((role) => user.roles!.includes(role));

    if (!tieneRol) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
