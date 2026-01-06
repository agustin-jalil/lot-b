import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { AuthProvider } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly jwt: JwtService,
  ) {}

  async validateGoogleUser(profile: {
    email?: string;
    name?: string;
    avatar?: string;
    providerId: string;
  }) {
    let user = await this.users.findByProvider(
      AuthProvider.GOOGLE,
      profile.providerId,
    );

    if (!user) {
      user = await this.users.createFromOAuth({
        ...profile,
        provider: AuthProvider.GOOGLE,
      });
    }

    return user;
  }

  signToken(userId: string) {
    return this.jwt.sign({
      sub: userId,
    });
  }
}
