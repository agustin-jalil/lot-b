import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { LotteryService } from './lottery.service';

@Controller('lottery')
export class LotteryController {
  constructor(private readonly lotteryService: LotteryService) {}

  // Crear una nueva lotería
  @Post()
  create(@Body('name') name: string) {
    return this.lotteryService.createLottery(name);
  }

  // Obtener la lotería activa
  @Get('current')
  getCurrent() {
    return this.lotteryService.getCurrentLottery();
  }

  // Forzar sorteo (admin / testing)
  @Post(':id/draw')
  draw(@Param('id') id: string) {
    return this.lotteryService.drawLottery(id);
  }
}
