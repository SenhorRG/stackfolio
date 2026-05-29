import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { AuthModule } from './features/auth/auth.module';
import { HealthModule } from './features/health/health.module';
import { HomeModule } from './features/home/home.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfilesModule } from './features/profiles/profiles.module';
import { ResumeModule } from './features/resume/resume.module';
import { SkillsModule } from './features/skills/skills.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        resolve(process.cwd(), '../../.env'),
        resolve(process.cwd(), '.env'),
      ],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    SkillsModule,
    ProfilesModule,
    ResumeModule,
    HomeModule,
  ],
})
export class AppModule {}
