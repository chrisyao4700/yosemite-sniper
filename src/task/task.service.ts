import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateTaskDto) {
    return this.prisma.task.create({ data: dto });
  }
  findAll() {
    return this.prisma.task.findMany();
  }
  findOne(id: number) {
    return this.prisma.task.findUnique({ where: { id } });
  }
  update(id: number, dto: UpdateTaskDto) {
    return this.prisma.task.update({ where: { id }, data: dto });
  }
  remove(id: number) {
    return this.prisma.task.delete({ where: { id } });
  }
}

