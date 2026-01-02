import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TicketModule } from './ticket/ticket.module';
import { LotteryModule } from './lottery/lottery.module';

@Module({
  imports: [TicketModule, LotteryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
