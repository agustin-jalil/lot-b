import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LotteryService {
  private readonly logger = new Logger(LotteryService.name);

  constructor(private prisma: PrismaService) {}

  async createLottery(name: string) {
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 90); // 3 meses

    return this.prisma.lottery.create({
      data: {
        name,
        startsAt,
        endsAt,
        status: 'OPEN'
      }
    });
  }

  async getCurrentLottery() {
    return this.prisma.lottery.findFirst({
      where: { status: 'OPEN' },
      include: {
        tickets: {
          select: {
            id: true,
            numbers: true,
            quantity: true,
            status: true,
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkLotteryExpiration() {
    const expiredLotteries = await this.prisma.lottery.findMany({
      where: {
        status: 'OPEN',
        OR: [
          { endsAt: { lte: new Date() } },
          {
            createdAt: {
              lte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 días
            }
          }
        ]
      }
    });

    for (const lottery of expiredLotteries) {
      await this.drawLottery(lottery.id);
    }
  }

  async drawLottery(lotteryId: string) {
    const lottery = await this.prisma.lottery.findUnique({
      where: { id: lotteryId },
      include: { tickets: true }
    });

    if (!lottery || lottery.status !== 'OPEN') {
      throw new BadRequestException('Lotería no válida');
    }

    if (lottery.tickets.length === 0) {
      // Cancelar si no hay tickets
      await this.prisma.lottery.update({
        where: { id: lotteryId },
        data: { status: 'CANCELLED' }
      });
      return;
    }

    // Generar números ganadores
    const winnerNumbers = this.generateWinnerNumbers();
    
    // Encontrar ticket ganador (más cercano)
    const winnerTicket = this.findWinnerTicket(lottery.tickets, winnerNumbers);

    // Actualizar lotería
    await this.prisma.lottery.update({
      where: { id: lotteryId },
      data: {
        status: 'DRAWN',
        winnerTicketId: winnerTicket.id,
        winnerNumbers,
        drawnAt: new Date()
      }
    });

    // Actualizar tickets
    await this.prisma.ticket.updateMany({
      where: { lotteryId, id: { not: winnerTicket.id } },
      data: { status: 'LOSER' }
    });

    await this.prisma.ticket.update({
      where: { id: winnerTicket.id },
      data: { status: 'WINNER' }
    });

    // Notificar ganador
    await this.notifyWinner(winnerTicket, lottery);

    // Crear nueva lotería
    await this.createLottery(`Lotería ${new Date().getFullYear()}`);

    this.logger.log(`Lotería ${lotteryId} sorteada. Ganador: ${winnerTicket.id}`);
  }

  private generateWinnerNumbers(): number[] {
    const numbers: number[] = [];
    while (numbers.length < 10) {
      const num = Math.floor(Math.random() * 100);
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers.sort((a, b) => a - b);
  }

  private findWinnerTicket(tickets: any[], winnerNumbers: number[]) {
    let maxMatches = 0;
    let winner = tickets[0];

    for (const ticket of tickets) {
      const matches = ticket.numbers.filter((n: number) => 
        winnerNumbers.includes(n)
      ).length;

      if (matches > maxMatches) {
        maxMatches = matches;
        winner = ticket;
      }
    }

    return winner;
  }

  private async notifyWinner(ticket: any, lottery: any) {
    await this.prisma.notification.create({
      data: {
        userId: ticket.userId,
        type: 'LOTTERY_WINNER',
        title: '🎉 ¡GANASTE LA LOTERÍA!',
        message: `Has ganado $${lottery.prizePool.toString()} en ${lottery.name}`,
        data: {
          ticketId: ticket.id,
          lotteryId: lottery.id,
          prize: lottery.prizePool.toString()
        }
      }
    });

    // Aquí integrarías el pago en BTC
    // await this.btcPaymentService.sendPrize(ticket.user, lottery.prizePool);
  }
}