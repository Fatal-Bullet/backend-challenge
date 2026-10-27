import { GetQueueAttributesCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MikroORM } from '@mikro-orm/core';
import { SQS_CLIENT } from '../infrastructure/messaging/sqs/sqs.tokens';

export interface ReadinessResult {
  status: 'ok';
  checks: {
    postgres: 'ok';
    sqs: 'ok';
  };
}

@Injectable()
export class ReadinessService {
  private readonly queueUrl: string;

  constructor(
    private readonly orm: MikroORM,
    @Inject(SQS_CLIENT) private readonly sqsClient: SQSClient,
    configService: ConfigService,
  ) {
    this.queueUrl = configService.getOrThrow<string>('SQS_QUEUE_URL');
  }

  async check(): Promise<ReadinessResult> {
    const [postgres, sqs] = await Promise.allSettled([
      this.checkPostgres(),
      this.checkSqs(),
    ]);

    if (postgres.status === 'rejected' || sqs.status === 'rejected') {
      throw new ServiceUnavailableException({
        status: 'error',
        checks: {
          postgres: postgres.status === 'fulfilled' ? 'ok' : 'error',
          sqs: sqs.status === 'fulfilled' ? 'ok' : 'error',
        },
      });
    }

    return {
      status: 'ok',
      checks: { postgres: 'ok', sqs: 'ok' },
    };
  }

  private async checkPostgres(): Promise<void> {
    await this.orm.em.getConnection().execute('select 1');
  }

  private async checkSqs(): Promise<void> {
    await this.sqsClient.send(new GetQueueAttributesCommand({
      QueueUrl: this.queueUrl,
      AttributeNames: ['ApproximateNumberOfMessages'],
    }));
  }
}