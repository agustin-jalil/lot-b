import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateTicketDto) {
    return this.ticketService.create(user.id, dto);
  }

  @Get('my-tickets')
  getMyTickets(@CurrentUser() user: { id: string }) {
    return this.ticketService.getUserTickets(user.id);
  }

  @Get('pricing')
  getPricing() {
    return {
      basePrice: 9.99,
      discounts: {
        1: { percent: 0, total: 9.99 },
        5: { percent: 10, total: 44.96 },
        10: { percent: 25, total: 74.93 }
      }
    };
  }
}
