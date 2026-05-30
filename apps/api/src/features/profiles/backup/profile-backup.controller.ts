import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ProfileBackupService } from './profile-backup.service';

@Controller('profiles/backup')
@UseGuards(JwtAuthGuard)
export class ProfileBackupController {
  constructor(private readonly backupService: ProfileBackupService) {}

  @Post('export')
  export(
    @CurrentUser() user: { userId: string },
    @Body() body: unknown,
  ) {
    return this.backupService.exportBackup(user.userId, body);
  }

  @Post('import')
  import(
    @CurrentUser() user: { userId: string },
    @Body() body: unknown,
  ) {
    return this.backupService.importBackup(user.userId, body);
  }
}
