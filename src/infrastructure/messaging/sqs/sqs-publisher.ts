import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SQS_CLIENT } from './sqs.tokens';

@Injectable()
export class SqsPublisher {
  private readonly queueUrl: string;

  constructor(
    @Inject(SQS_CLIENT) private readonly client: SQSClient,
    configService: ConfigService,
  ) {
    this.queueUrl = configService.getOrThrow<string>('SQS_QUEUE_URL');
  }

  async publish(
    message: Readonly<Record<string, unknown>>,
    messageGroupId: string,
    messageDeduplicationId: string,
  ): Promise<string | undefined> {
    const result = await this.client.send(new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(message),
      MessageGroupId: messageGroupId,
      MessageDeduplicationId: messageDeduplicationId,
    }));

    return result.MessageId;
  }
}