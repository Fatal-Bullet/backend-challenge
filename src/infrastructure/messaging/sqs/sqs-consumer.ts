import {
  ChangeMessageVisibilityCommand,
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SQS_CLIENT } from './sqs.tokens';

@Injectable()
export class SqsConsumer {
  private readonly queueUrl: string;

  constructor(
    @Inject(SQS_CLIENT) private readonly client: SQSClient,
    configService: ConfigService,
  ) {
    this.queueUrl = configService.getOrThrow<string>('SQS_QUEUE_URL');
  }

  async receive(maxNumberOfMessages = 10, visibilityTimeout = 30): Promise<Message[]> {
    const result = await this.client.send(new ReceiveMessageCommand({
      QueueUrl: this.queueUrl,
      MaxNumberOfMessages: maxNumberOfMessages,
      WaitTimeSeconds: 10,
      VisibilityTimeout: visibilityTimeout,
      MessageAttributeNames: ['All'],
    }));

    return result.Messages ?? [];
  }

  async acknowledge(receiptHandle: string): Promise<void> {
    await this.client.send(new DeleteMessageCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
    }));
  }

  async retry(receiptHandle: string, visibilityTimeout: number): Promise<void> {
    await this.client.send(new ChangeMessageVisibilityCommand({
      QueueUrl: this.queueUrl,
      ReceiptHandle: receiptHandle,
      VisibilityTimeout: visibilityTimeout,
    }));
  }
}