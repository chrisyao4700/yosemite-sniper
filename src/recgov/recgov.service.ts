// src/recgov/recgov.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as dayjs from 'dayjs';
import { Task } from '@prisma/client';

@Injectable()
export class RecGovService {
  private logger = new Logger(RecGovService.name);
  private browser!: puppeteer.Browser;
  private contextDir = '.recgov-cache';   // 保存 cookie

  /** 单例浏览器，复用 cookie */
  private async getBrowser(): Promise<puppeteer.Browser> {
    if (this.browser) return this.browser;

    this.browser = await puppeteer.launch({
      headless: 'shell',                         // Puppeteer v21+ 新协议
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      userDataDir: this.contextDir,           // 让 cookie 落在本地文件夹
    });

    // 首次启动时自动登录
    const pages = await this.browser.pages();
    const page = pages.length ? pages[0] : await this.browser.newPage();
    await page.goto('https://www.recreation.gov/', { waitUntil: 'domcontentloaded' });

    // 若 cookie 已存在，保持沉默
    const isSignedIn = await page.$('button:has-text("Sign In")') === null;
    if (!isSignedIn) {
      await page.click('button:has-text("Sign In")');
      await page.type('#email', process.env.RECGOV_EMAIL!);
      await page.type('#rec-acct-sign-in-password', process.env.RECGOV_PASSWORD!);
      await page.click('button[type=submit]');
      await page.waitForNavigation({ waitUntil: 'networkidle0' });
      this.logger.log('Recreation.gov login saved to cache');
    }
    await page.close();
    return this.browser;
  }

  /** 查询余票（纯 HTTP）*/
  async hasAvailability(task: Task): Promise<boolean> {
    const campgroundId = this.mapGround2Id(task.campGround);
    const month = dayjs(task.startDate)
      .startOf('month')
      .format('YYYY-MM-01T00:00:00.000[Z]');

    const url =
      `https://www.recreation.gov/api/camps/availability/campground/${campgroundId}/month` +
      `?start_date=${month}`;

    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) {
      this.logger.warn(`Availability fetch failed: ${res.status}`);
      return false;
    }

    const json = (await res.json()) as any;
    const key = `${dayjs(task.startDate).format('YYYY-MM-DD')}T00:00:00Z`;
    const available = Object.values<any>(json.campsites ?? {}).some(
      (site) => site.availabilities[key] === 'Available',
    );
    return available;
  }

  /** 抢票（Puppeteer 操作真实页面）*/
  async book(task: Task): Promise<boolean> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30_000);

    try {
      const url = this.buildBookingUrl(task);
      await page.goto(url, { waitUntil: 'networkidle0' });

      // 等待日期格子渲染
      await page.waitForSelector('[data-cy=availability-grid]');
      const selector =
        `[data-cy=available][data-date="${dayjs(task.startDate).format('YYYY-MM-DD')}"]`;
      const slot = await page.$(selector);
      if (!slot) throw new Error('No slot in DOM');
      await slot.click();

      await page.click('button:has-text("Book Now")');
      await page.waitForSelector('text=Reservation Details');

      await page.click('button:has-text("Proceed to Cart")');
      await page.waitForNavigation({
        waitUntil: 'networkidle0',
      });
      // Optionally, check if the URL contains 'cart'
      if (!page.url().includes('cart')) {
        throw new Error('Did not navigate to cart page');
      }
      this.logger.log(`✅ Book success for task #${task.id}`);
      return true;
    } catch (err) {
      this.logger.error(`❌ Book failed for #${task.id}: ${err}`);
      return false;
    } finally {
      await page.close();
    }
  }

  /* ------ 私有工具 ------ */

  private mapGround2Id(name: string): number {
    return (
      {
        'Upper Pines': 232450,
        'Lower Pines': 232447,
        'North Pines': 232452,
      }[name] ?? 0
    );
  }

  private buildBookingUrl(task: Task) {
    const id = this.mapGround2Id(task.campGround);
    const date = dayjs(task.startDate).format('YYYY-MM-DD');
    return `https://www.recreation.gov/camping/campgrounds/${id}?date=${date}`;
  }
}
