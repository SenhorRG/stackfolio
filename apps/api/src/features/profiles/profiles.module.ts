import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SkillsModule } from '../skills/skills.module';
import { ProfileBackupController } from './backup/profile-backup.controller';
import { ProfileBackupService } from './backup/profile-backup.service';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { ProfilePdfImportService } from './pdf/profile-pdf-import.service';

@Module({
  imports: [AuthModule, SkillsModule],
  controllers: [ProfilesController, ProfileBackupController],
  providers: [ProfilesService, ProfilePdfImportService, ProfileBackupService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
