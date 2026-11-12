import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DatabaseService } from './database/database.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  @SkipThrottle()
  @ApiOperation({ summary: 'Liveness + database connectivity check' })
  async check() {
    await this.database.ping();
    return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
  }
}
