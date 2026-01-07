import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;
  app.enableCors(
    {
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      credentials: true,
    }
  );
  
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
