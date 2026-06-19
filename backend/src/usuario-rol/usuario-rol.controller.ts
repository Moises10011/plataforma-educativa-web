import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UsuarioRolService } from './usuario-rol.service';
import { CreateUsuarioRolDto } from './dto/create-usuario-rol.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Administrador')
@Controller('usuario-rol')
export class UsuarioRolController {
  constructor(private readonly usuarioRolService: UsuarioRolService) {}

  @Post()
  asignar(@Body() createUsuarioRolDto: CreateUsuarioRolDto) {
    return this.usuarioRolService.asignar(createUsuarioRolDto);
  }

  @Get(':id_usuario')
  findRolesByUsuario(@Param('id_usuario', ParseIntPipe) id_usuario: number) {
    return this.usuarioRolService.findRolesByUsuario(id_usuario);
  }

  @Delete(':id_usuario/:id_rol')
  remove(
    @Param('id_usuario', ParseIntPipe) id_usuario: number,
    @Param('id_rol', ParseIntPipe) id_rol: number,
  ) {
    return this.usuarioRolService.remove(id_usuario, id_rol);
  }
}
