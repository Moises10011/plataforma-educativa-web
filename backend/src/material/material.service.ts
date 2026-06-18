import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Material } from './entities/material.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
  ) {}

  async create(createMaterialDto: CreateMaterialDto) {
    const material = this.materialRepository.create(createMaterialDto);
    return await this.materialRepository.save(material);
  }

  findAll() {
    return this.materialRepository.find({
      relations: {
        asignacion: true,
      },
    });
  }

  async findOne(id: number) {
    const material = await this.materialRepository.findOne({
      where: { id_material: id },
      relations: {
        asignacion: true,
      },
    });
    if (!material) throw new NotFoundException(`Material #${id} no encontrado`);
    return material;
  }

  async update(id: number, updateMaterialDto: UpdateMaterialDto) {
    const material = await this.findOne(id);
    Object.assign(material, updateMaterialDto);
    return await this.materialRepository.save(material);
  }

  async remove(id: number) {
    const material = await this.findOne(id);
    await this.materialRepository.remove(material);
    return { message: `Material #${id} eliminado correctamente` };
  }
}
