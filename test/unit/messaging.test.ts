import { describe, expect, it } from 'bun:test';
import { InboxMessage } from '../../src/domain/messaging/inbox-message';
import { WagerTransactionProcessed } from '../../src/domain/messaging/integration-events';
import { OutboxMessage } from '../../src/domain/messaging/outbox-message';

describe('messaging domain', () => {
  it('marks an inbox message once', () => {
    const inbox = InboxMessage.receive({
      messageId: 'message-1',
      consumerName: 'wager-consumer',
      payloadHash: 'hash-1',
    });
    inbox.markProcessed(new Date('2026-01-01T00:00:00.000Z'));

    expect(inbox.isProcessed()).toBe(true);
    expect(() => inbox.markProcessed(new Date())).toThrow('already processed');
  });

  it('serializes a typed event into an outbox message', () => {
    const event = new WagerTransactionProcessed({
      eventId: 'event-1',
      aggregateId: 'transaction-1',
      correlationId: 'correlation-1',
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
      data: {
        transactionId: 'transaction-1',
        providerId: 'provider-1',
        externalTransactionId: 'external-1',
        status: 'PROCESSED',
        money: { amount: '25.00', currency: 'BRL' },
      },
    });
    const outbox = OutboxMessage.enqueue(event);

    expect(outbox.isDue(new Date('2026-01-01T00:00:00.000Z'))).toBe(true);
    expect(outbox.eventType).toBe('WagerTransactionProcessed');
    expect(outbox.payload).toMatchObject({ eventType: 'WagerTransactionProcessed', version: 1 });
  });

  it('uses exponential retry backoff and publishes once', () => {
    const event = new WagerTransactionProcessed({
      eventId: 'event-1',
      aggregateId: 'transaction-1',
      correlationId: 'correlation-1',
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
      data: {} as never,
    });
    const outbox = OutboxMessage.enqueue(event);
    const now = new Date('2026-01-01T00:00:00.000Z');
    outbox.scheduleRetry(now);

    expect(outbox.attempts).toBe(1);
    expect(outbox.nextAttemptAt?.getTime()).toBe(now.getTime() + 1000);
    expect(outbox.isDue(now)).toBe(false);

    outbox.markPublished(new Date(now.getTime() + 1000));
    expect(outbox.isPending()).toBe(false);
    expect(() => outbox.scheduleRetry(now)).toThrow('cannot be retried');
  });
});