import { Injectable } from '@nestjs/common';
import { AuthProvider, User } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProvider(
    provider: AuthProvider,
    providerId: string,
  ): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        provider_providerId: {
          provider,
          providerId,
        },
      },
    });
  }

  async createFromOAuth(data: {
    email?: string;
    name?: string;
    avatar?: string;
    provider: AuthProvider;
    providerId: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }
}
