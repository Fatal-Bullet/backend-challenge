import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';

@Entity({ tableName: 'inbox_messages' })
@Unique({ properties: ['consumerName', 'messageId'] })
export class InboxMessageEntity {
  @PrimaryKey({ fieldName: 'message_id', length: 255 })
  messageId!: string;

  @PrimaryKey({ fieldName: 'consumer_name', length: 255 })
  consumerName!: string;

  @Property({ fieldName: 'payload_hash', length: 128 })
  payloadHash!: string;

  @Property({ fieldName: 'received_at' })
  receivedAt!: Date;

  @Property({ fieldName: 'processed_at', nullable: true })
  processedAt?: Date;
}