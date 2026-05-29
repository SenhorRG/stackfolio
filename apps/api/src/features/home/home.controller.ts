import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  dashboard(@CurrentUser() user: { userId: string }) {
    return this.homeService.dashboard(user.userId);
  }

  @Get('learning')
  @UseGuards(JwtAuthGuard)
  learning(
    @CurrentUser() user: { userId: string },
    @Query('limit') limit = '10',
  ) {
    return this.homeService.learningSuggestions(
      user.userId,
      Number(limit) || 10,
    );
  }
}
