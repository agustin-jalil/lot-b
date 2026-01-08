import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/client';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Injectable()
export class TicketService {
  private readonly BASE_PRICE = 9.99;
  
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateTicketDto) {
    // Validar números únicos
    if (new Set(dto.numbers).size !== 10) {
      throw new BadRequestException('Los 10 números deben ser únicos');
    }

    if (dto.numbers.some(n => n < 0 || n > 99)) {
      throw new BadRequestException('Los números deben estar entre 0 y 99');
    }

    // Obtener lotería activa
    const lottery = await this.prisma.lottery.findFirst({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' }
    });

    if (!lottery) {
      throw new NotFoundException('No hay lotería activa');
    }

    // Verificar si la combinación ya existe
    const sortedNumbers = [...dto.numbers].sort((a, b) => a - b);

    const existing = await this.prisma.ticket.findFirst({
      where: {
        lotteryId: lottery.id,
        numbers: {
          equals: sortedNumbers
        }
      }
    });

    if (existing) {
      throw new BadRequestException('Esta combinación de números ya existe en el pozo');
    }

    // Calcular precio con descuento
    const pricing = this.calculatePrice(dto.quantity);

    // Crear ticket
    const ticket = await this.prisma.ticket.create({
      data: {
        lotteryId: lottery.id,
        userId,
        numbers: dto.numbers.sort((a, b) => a - b),
        quantity: dto.quantity,
        pricePerTicket: new Decimal(this.BASE_PRICE),
        totalPrice: new Decimal(pricing.total),
        discount: new Decimal(pricing.discountPercent),
        transactionHash: dto.transactionHash
      }
    });

    // Actualizar pozo
    await this.prisma.lottery.update({
      where: { id: lottery.id },
      data: {
        prizePool: {
          increment: new Decimal(pricing.total * 0.8) // 80% va al pozo
        }
      }
    });

    // Procesar comisiones de referidos
    await this.processReferralCommission(userId, ticket.id, pricing.total);

    // Notificar
    await this.createNotification(userId, {
      type: 'PURCHASE_SUCCESS',
      title: 'Compra exitosa',
      message: `Has comprado ${dto.quantity} ticket(s) por $${pricing.total.toFixed(2)}`,
      data: { ticketId: ticket.id }
    });

    return ticket;
  }

  calculatePrice(quantity: number) {
    let discountPercent = 0;
    
    if (quantity === 10) discountPercent = 25;
    else if (quantity === 5) discountPercent = 10;
    else if (quantity === 1) discountPercent = 0;
    else throw new BadRequestException('Solo puedes comprar 1, 5 o 10 tickets');

    const subtotal = this.BASE_PRICE * quantity;
    const discount = subtotal * (discountPercent / 100);
    const total = subtotal - discount;

    return { subtotal, discount, total, discountPercent };
  }

  private async processReferralCommission(userId: string, ticketId: string, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { referrer: true }
    });

    if (user?.referrer) {
      const commission = amount * 0.2; // 20% de comisión

      await this.prisma.commission.create({
        data: {
          userId: user.referrer.id,
          ticketId,
          amount: new Decimal(commission),
          percentage: new Decimal(20)
        }
      });

      await this.createNotification(user.referrer.id, {
        type: 'COMMISSION_EARNED',
        title: 'Comisión ganada',
        message: `Has ganado $${commission.toFixed(2)} por referir a ${user.name}`,
        data: { ticketId, amount: commission }
      });
    }
  }

  async getUserTickets(userId: string) {
    return this.prisma.ticket.findMany({
      where: { userId },
      include: {
        lottery: {
          select: {
            id: true,
            name: true,
            status: true,
            prizePool: true,
            endsAt: true
          }
        }
      },
      orderBy: { purchasedAt: 'desc' }
    });
  }

  private async createNotification(userId: string, data: any) {
    return this.prisma.notification.create({
      data: {
        userId,
        ...data
      }
    });
  }
}
