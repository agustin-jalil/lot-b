export class CreateTicketDto {
  numbers: number[]; // Array de 10 números (0-99)
  quantity: 1 | 5 | 10;
  transactionHash?: string; // Hash de pago BTC
}