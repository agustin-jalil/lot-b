import { Controller, Get, Param, Post } from '@nestjs/common';
import { CommissionService } from './commission.service';

@Controller('commissions')
export class CommissionController {
  constructor(private readonly commissionService: CommissionService) {}

  // Obtener comisiones de un usuario
  @Get('user/:userId')
  getUserCommissions(@Param('userId') userId: string) {
    return this.commissionService.getUserCommissions(userId);
  }

  // Obtener total ganado por un usuario
  @Get('user/:userId/total')
  getTotal(@Param('userId') userId: string) {
    return this.commissionService.getTotalEarnings(userId);
  }

  // Ejecutar pago de comisiones (cron / admin)
  @Post('pay')
  payCommissions() {
    return this.commissionService.payCommissions();
  }
}
