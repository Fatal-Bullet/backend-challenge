import { Entity, Index, PrimaryKey, Property, Unique } from '@mikro-orm/core';

@Entity({ tableName: 'wallet_ledger_entries' })
@Unique({ properties: ['walletId', 'transactionId'] })
@Index({ properties: ['walletId', 'createdAt', 'id'] })
export class LedgerEntryEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ fieldName: 'wallet_id', type: 'uuid' })
  walletId!: string;

  @Property({ fieldName: 'transaction_id', type: 'uuid' })
  transactionId!: string;

  @Property({ length: 10 })
  direction!: string;

  @Property({ type: 'numeric', precision: 20, scale: 2 })
  amount!: string;

  @Property({ length: 3 })
  currency!: string;

  @Property({ fieldName: 'balance_before', type: 'numeric', precision: 20, scale: 2 })
  balanceBefore!: string;

  @Property({ fieldName: 'balance_after', type: 'numeric', precision: 20, scale: 2 })
  balanceAfter!: string;

  @Property({ fieldName: 'created_at' })
  createdAt!: Date;
}