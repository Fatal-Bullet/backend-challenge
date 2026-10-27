export * from './inbox-message.entity';
export * from './ledger-entry.entity';
export * from './outbox-message.entity';
export * from './wallet.entity';
export * from './wager-transaction.entity';

import { InboxMessageEntity } from './inbox-message.entity';
import { LedgerEntryEntity } from './ledger-entry.entity';
import { OutboxMessageEntity } from './outbox-message.entity';
import { WalletEntity } from './wallet.entity';
import { WagerTransactionEntity } from './wager-transaction.entity';

export const entities = [
	InboxMessageEntity,
	LedgerEntryEntity,
	OutboxMessageEntity,
	WalletEntity,
	WagerTransactionEntity,
];