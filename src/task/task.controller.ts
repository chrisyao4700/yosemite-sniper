import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('tasks')
@Controller('tasks')
export class TaskController {
  constructor(private readonly service: TaskService) {}

  @Post() create(@Body() dto: CreateTaskDto) { return this.service.create(dto); }

  @Get() findAll() { return this.service.findAll(); }

  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id') update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ) { return this.service.update(id, dto); }

  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
