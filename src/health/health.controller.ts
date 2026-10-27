import { Controller, Get } from '@nestjs/common';
import { ReadinessService } from './readiness.service';

@Controller('health')
export class HealthController {
  constructor(private readonly readinessService: ReadinessService) {}

  @Get('live')
  live(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  ready() {
    return this.readinessService.check();
  }
}