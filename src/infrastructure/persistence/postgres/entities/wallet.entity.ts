import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';

@Entity({ tableName: 'wallets' })
@Unique({ properties: ['playerId', 'currency'] })
export class WalletEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ fieldName: 'player_id', length: 255 })
  playerId!: string;

  @Property({ length: 3 })
  currency!: string;

  @Property({ type: 'numeric', precision: 20, scale: 2 })
  balance!: string;

  @Property()
  version!: number;

  @Property({ fieldName: 'created_at' })
  createdAt!: Date;

  @Property({ fieldName: 'updated_at' })
  updatedAt!: Date;
}