import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async generateJwt(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      provider: user.provider,
    };
    return this.jwtService.sign(payload);
  }

  async validateUser(userId: string): Promise<any> {
    // This will be used by JWT strategy
    return { userId };
  }
}