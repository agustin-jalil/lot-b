import { Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";

@Injectable()
export class CommissionService {
  constructor(private prisma: PrismaService) {}

  async getUserCommissions(userId: string) {
    return this.prisma.commission.findMany({
      where: { userId },
      include: {
        ticket: {
          include: {
            lottery: true,
            user: { select: { name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getTotalEarnings(userId: string) {
    const result = await this.prisma.commission.aggregate({
      where: { userId, status: 'PAID' },
      _sum: { amount: true }
    });

    return result._sum.amount || 0;
  }

  async payCommissions() {
    const pending = await this.prisma.commission.findMany({
      where: { status: 'PENDING' },
      include: { user: true }
    });

    for (const commission of pending) {
      // Aquí integrarías el pago en BTC
      // await this.btcPaymentService.sendCommission(commission.user, commission.amount);

      await this.prisma.commission.update({
        where: { id: commission.id },
        data: { status: 'PAID', paidAt: new Date() }
      });

      await this.prisma.notification.create({
        data: {
          userId: commission.userId,
          type: 'COMMISSION_PAID',
          title: 'Comisión pagada',
          message: `Se ha pagado tu comisión de $${commission.amount.toString()}`,
          data: { commissionId: commission.id }
        }
      });
    }
  }
}
