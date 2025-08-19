import { Controller, Get, Post, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { TemplatesService, CreateTemplateDto } from './templates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  async list(
    @Query('q') q?: string,
    @Query('sort') sort: 'latest' | 'likes' = 'latest',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('authorId') authorId?: string,
  ) {
    return this.templatesService.findAll({
      q,
      sort,
      page: Math.max(parseInt(page) || 1, 1),
      limit: Math.min(Math.max(parseInt(limit) || 20, 1), 100),
      authorId,
    });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.templatesService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateTemplateDto, @Req() req: any) {
    const userId = req.user?._id?.toString();
    return this.templatesService.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async toggleLike(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?._id?.toString();
    return this.templatesService.toggleLike(id, userId);
  }
}
