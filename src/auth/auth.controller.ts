import {
  Controller,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * 🔐 Inicia login con Google
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    // Passport maneja el redirect
  }

  /**
   * 🔐 Callback de Google
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request) {
    const googleUser = req.user as any;

    const user = await this.auth.validateGoogleUser(googleUser);
    const accessToken = this.auth.signToken(user.id);

    return { accessToken };
  }

  /**
   * 🧪 Endpoint protegido por JWT
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { id: string }) {
    return user;
  }
}
