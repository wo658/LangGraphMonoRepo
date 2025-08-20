import { Controller, Get, Post, Body, Query, Param, UseGuards, Req, Patch, Delete } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async list(
    @Query('q') q?: string,
    @Query('sort') sort: 'latest' | 'likes' = 'latest',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('authorId') authorId?: string,
    @Query('scope') scope?: 'public' | 'mine',
    @Req() req?: any,
  ) {
    return this.templatesService.findAll({
      q,
      sort,
      page: Math.max(parseInt(page) || 1, 1),
      limit: Math.min(Math.max(parseInt(limit) || 20, 1), 100),
      authorId,
      scope,
      currentUserId: req?.user?._id?.toString(),
    });
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getOne(@Param('id') id: string, @Req() req: any) {
    const userId = req?.user?._id?.toString();
    return this.templatesService.findById(id, userId);
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

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @Req() req: any,
  ) {
    const userId = req.user?._id?.toString();
    return this.templatesService.update(id, dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?._id?.toString();
    return this.templatesService.remove(id, userId);
  }

  // sharing removed
}
