import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkillLevel } from '@prisma/client';
import { ProfileIdentity } from '@stackfolio/shared';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfilesService } from './profiles.service';

const pdfUpload = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly service: ProfilesService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.service.listForUser(user.userId);
  }

  @Get('main')
  main(@CurrentUser() user: { userId: string }) {
    return this.service.getMainProfile(user.userId);
  }

  @Get(':id')
  one(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.service.getById(user.userId, id);
  }

  @Post()
  create(
    @CurrentUser() user: { userId: string },
    @Body()
    body: {
      name: string;
      basedOnProfileId?: string;
      copyFromMain?: boolean;
    },
  ) {
    return this.service.create(user.userId, body);
  }

  @Post('parse-pdf')
  @UseInterceptors(pdfUpload)
  parsePdf(@UploadedFile() file: Express.Multer.File) {
    return this.service.parsePdf(file);
  }

  @Post('from-pdf')
  @UseInterceptors(pdfUpload)
  createFromPdf(
    @CurrentUser() user: { userId: string },
    @Body('name') name: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.createFromPdf(user.userId, name, file);
  }

  @Post(':id/duplicate')
  duplicate(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: { name?: string },
  ) {
    return this.service.duplicate(user.userId, id, body.name);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: { name?: string },
  ) {
    return this.service.update(user.userId, id, body);
  }

  @Post(':id/copy-from-main')
  copyFromMain(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.service.copyFromMain(user.userId, id);
  }

  @Post(':id/import-from-pdf')
  @UseInterceptors(pdfUpload)
  importFromPdf(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.importFromPdf(user.userId, id, file);
  }

  @Patch(':id/profile-data')
  updateProfileData(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() body: ProfileIdentity,
  ) {
    return this.service.updateProfileData(user.userId, id, body);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.service.remove(user.userId, id);
  }

  @Post(':id/skills')
  upsertSkill(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body()
    body: {
      skillId: string;
      level: SkillLevel;
      years?: number;
      highlight?: boolean;
      displayCategory?: string | null;
    },
  ) {
    return this.service.upsertSkill(user.userId, id, body);
  }

  @Delete(':id/skills/:skillId')
  removeSkill(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Param('skillId') skillId: string,
  ) {
    return this.service.removeSkill(user.userId, id, skillId);
  }

  @Post(':id/track-recent')
  trackRecent(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.service.trackRecent(user.userId, id);
  }
}
