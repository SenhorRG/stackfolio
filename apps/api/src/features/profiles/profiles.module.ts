import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SkillsModule } from '../skills/skills.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { ProfilePdfImportService } from './pdf/profile-pdf-import.service';

@Module({
  imports: [AuthModule, SkillsModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, ProfilePdfImportService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
