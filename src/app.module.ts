import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskModule } from './task/task.module';
import { PrismaModule } from './prisma/prisma.module';
import { RecgovService } from './recgov/recgov.service';

@Module({
  imports: [TaskModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService, RecgovService],
})
export class AppModule {}
