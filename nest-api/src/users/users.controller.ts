import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/search?q=keyword&limit=10
  @UseGuards(JwtAuthGuard)
  @Get('search')
  async search(
    @Query('q') q: string = '',
    @Query('limit') limit: string = '10',
    @Req() req: any,
  ) {
    const userId = req.user?._id?.toString();
    return this.usersService.search(q, parseInt(limit) || 10, userId);
    }
}
