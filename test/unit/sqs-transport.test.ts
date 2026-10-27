import { describe, expect, it } from 'bun:test';
import { SQSClient } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { SqsConsumer } from '../../src/infrastructure/messaging/sqs/sqs-consumer';
import { SqsPublisher } from '../../src/infrastructure/messaging/sqs/sqs-publisher';

const config = new ConfigService({ SQS_QUEUE_URL: 'http://localhost:4566/queue.fifo' });

describe('SQS transport', () => {
  it('publishes FIFO messages with group and deduplication ids', async () => {
    const commands: unknown[] = [];
    const client = {
      send: async (command: unknown) => {
        commands.push(command);
        return { MessageId: 'message-1' };
      },
    } as unknown as SQSClient;
    const publisher = new SqsPublisher(client, config);

    await expect(publisher.publish({ type: 'WagerTransactionRequested' }, 'wallet-1', 'event-1'))
      .resolves.toBe('message-1');
    expect((commands[0] as { input: Record<string, unknown> }).input).toMatchObject({
      QueueUrl: 'http://localhost:4566/queue.fifo',
      MessageGroupId: 'wallet-1',
      MessageDeduplicationId: 'event-1',
    });
  });

  it('receives and acknowledges messages through the configured queue', async () => {
    const commands: unknown[] = [];
    const client = {
      send: async (command: { input: Record<string, unknown> }) => {
        commands.push(command);
        if (commands.length === 1) return { Messages: [{ MessageId: 'message-1' }] };
        return {};
      },
    } as unknown as SQSClient;
    const consumer = new SqsConsumer(client, config);

    await expect(consumer.receive(2, 45)).resolves.toHaveLength(1);
    await consumer.acknowledge('receipt-1');

    expect((commands[0] as { input: Record<string, unknown> }).input).toMatchObject({
      MaxNumberOfMessages: 2,
      VisibilityTimeout: 45,
    });
    expect((commands[1] as { input: Record<string, unknown> }).input).toMatchObject({
      ReceiptHandle: 'receipt-1',
    });
  });
});