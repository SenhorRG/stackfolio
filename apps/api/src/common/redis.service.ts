import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private memory = new Map<string, { value: string; expiresAt: number }>();

  get isEnabled(): boolean {
    return Boolean(process.env.REDIS_URL);
  }

  private getClient(): Redis | null {
    if (!process.env.REDIS_URL) return null;
    if (!this.client) {
      this.client = new Redis(process.env.REDIS_URL);
      this.client.on('error', (err) =>
        this.logger.warn(`Redis error: ${err.message}`),
      );
    }
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    const redis = this.getClient();
    if (redis) return redis.get(key);
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memory.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    const redis = this.getClient();
    if (redis) {
      await redis.set(key, value, 'EX', ttlSeconds);
      return;
    }
    this.memory.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }
}
