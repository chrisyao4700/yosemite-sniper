// src/task/task.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as tz from 'dayjs/plugin/timezone';

import { TaskService } from './task.service';
import { RecGovService } from '../recgov/recgov.service';
import { Task } from '@prisma/client';

dayjs.extend(utc);
dayjs.extend(tz);

@Injectable()
export class TaskScheduler {
  private readonly logger = new Logger(TaskScheduler.name);
  private readonly zone = 'America/Los_Angeles';

  constructor(
    private readonly taskService: TaskService,
    private readonly recgov: RecGovService,
  ) {}

  /**
   * 每天 06:59:50 PT 运行。
   * 真正执行抢票逻辑的日期条件：
   *   1) 今天是每月 15 号（Recreation.gov 统一开放日）
   *   2) 任务的 startDate 处于 “今天 +5 个月” 的那个整月
   */
  @Cron('50 59 6 * * *', { timeZone: 'America/Los_Angeles' })
  async handleBooking(): Promise<void> {
    const now = dayjs().tz(this.zone);
    if (now.date() !== 15) {
      this.logger.debug('⏭  非 15 日，跳过秒杀流程');
      return;
    }

    const openMonth = now.add(5, 'month').startOf('month'); // eg 2025-11-01
    const tasks = await this.taskService.findAll();

    for (const task of tasks) {
      if (!task.autoBook) continue; // 已标记完成/关闭
      if (dayjs(task.startDate).isSame(openMonth, 'month')) {
        await this.tryBookWithLog(task, 'Release-Day');
      }
    }
  }

  /**
   * 每 5 分钟轮询一次余票；若发现可订则立即下单。
   */
  @Cron(CronExpression.EVERY_5_MINUTES, { timeZone: 'America/Los_Angeles' })
  async handleMonitoring(): Promise<void> {
    const tasks = await this.taskService.findAll();

    for (const task of tasks) {
      if (!task.autoBook) continue;

      try {
        const has = await this.recgov.hasAvailability(task);
        if (has) {
          this.logger.verbose(
            `🎯 发现可订余票 (Task #${task.id} ${task.campGround} ${task.startDate.toISOString()})`,
          );
          await this.tryBookWithLog(task, 'Monitor');
        }
      } catch (err) {
        this.logger.error(`监控检查失败 #${task.id}: ${err}`);
      }
    }
  }

  /* ---------- 私有工具 ---------- */

  private async tryBookWithLog(task: Task, source: 'Release-Day' | 'Monitor'): Promise<void> {
    try {
      const success = await this.recgov.book(task);
      if (success) {
        await this.taskService.update(task.id, { autoBook: false }); // 关闭后续监控
        this.logger.log(`✅  ${source} 抢票成功 #${task.id}`);
        // TODO: 注入 NotificationService 并发送成功通知
      } else {
        this.logger.warn(`❌  ${source} 抢票失败 #${task.id}`);
      }
    } catch (err) {
      this.logger.error(`🚨  ${source} 过程中异常 #${task.id}: ${err}`);
    }
  }
}
