import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {
    // Passport automatically redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req, @Res() res: Response) {
    const token = await this.authService.generateJwt(req.user);
    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.redirect(this.configService.get('FRONTEND_URL'));
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport automatically redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res: Response) {
    const token = await this.authService.generateJwt(req.user);
    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    res.redirect(this.configService.get('FRONTEND_URL'));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req) {
    const user = req.user;
    return {
      id: user._id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      aiUsage: user.aiUsage,
    };
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('auth-token');
    res.status(HttpStatus.OK).json({ message: 'Logged out successfully' });
  }
}