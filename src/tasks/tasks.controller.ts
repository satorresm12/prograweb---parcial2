import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthGuard } from '../auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task, TaskDocument } from './schemas/task.schema';
import { TasksService } from './tasks.service';
import { UsersService } from '../users/users.service';

@Controller('tasks')
export class TasksController {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    private readonly usersService: UsersService,
    private readonly tasksService: TasksService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() createTaskDto: CreateTaskDto) {
    await this.usersService.findById(createTaskDto.userId);
    return this.taskModel.create(createTaskDto);
  }

  @Get()
  async findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }
}
