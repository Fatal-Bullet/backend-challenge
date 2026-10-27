import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'outbox_messages' })
@Index({ properties: ['publishedAt', 'nextAttemptAt'] })
export class OutboxMessageEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ fieldName: 'aggregate_id', type: 'uuid' })
  aggregateId!: string;

  @Property({ fieldName: 'event_type', length: 120 })
  eventType!: string;

  @Property({ type: 'json' })
  payload!: Record<string, unknown>;

  @Property({ fieldName: 'occurred_at' })
  occurredAt!: Date;

  @Property()
  attempts = 0;

  @Property({ fieldName: 'next_attempt_at', nullable: true })
  nextAttemptAt?: Date;

  @Property({ fieldName: 'published_at', nullable: true })
  publishedAt?: Date;
}