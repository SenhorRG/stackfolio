import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  BulkUpdateSkillCategoryInput,
  CreateCustomSkillInput,
  MergeSkillsInput,
  UpdateSkillAdminInput,
} from '@stackfolio/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SkillsService } from './skills.service';

@Controller('skills')
export class SkillsController {
  constructor(private readonly service: SkillsService) {}

  @Get()
  list(
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('limit') limit = '50',
    @Query('offset') offset = '0',
  ) {
    return this.service.list({
      q,
      category,
      limit: Math.min(Number(limit) || 50, 100),
      offset: Number(offset) || 0,
    });
  }

  @Get('categories')
  categories() {
    return this.service.categories();
  }

  @Get('export')
  @UseGuards(JwtAuthGuard)
  @Header('Content-Disposition', 'attachment; filename="skills-export.json"')
  exportCatalog() {
    return this.service.exportCatalog();
  }

  @Patch('bulk/category')
  @UseGuards(JwtAuthGuard)
  bulkUpdateCategory(@Body() body: Record<string, unknown>) {
    return this.service.bulkUpdateCategory(
      body as BulkUpdateSkillCategoryInput,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: Record<string, unknown>) {
    return this.service.create(body as CreateCustomSkillInput);
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  merge(@Body() body: Record<string, unknown>) {
    return this.service.merge(body as MergeSkillsInput);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, body as UpdateSkillAdminInput);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }
}
