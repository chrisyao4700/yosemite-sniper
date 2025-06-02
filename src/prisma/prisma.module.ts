import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()                       // 标记为全局，其他模块不再手动导入
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
