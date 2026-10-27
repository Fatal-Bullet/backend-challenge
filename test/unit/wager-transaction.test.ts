import { describe, expect, it } from 'bun:test';
import { Money } from '../../src/domain/money/money';
import { LedgerDirection } from '../../src/domain/wallet/wallet-ledger-entry';
import {
  FailureCode,
  InvalidTransactionStateError,
  WagerTransaction,
  WagerTransactionKind,
  WagerTransactionStatus,
} from '../../src/domain/wallet/wager-transaction';

const money = (amount: string): Money => Money.from({ amount, currency: 'BRL' });
const props = (kind: WagerTransactionKind, referenceExternalTransactionId?: string) => ({
  id: 'transaction-1',
  providerId: 'provider-1',
  externalTransactionId: 'external-1',
  idempotencyKey: 'provider-1:external-1',
  payloadHash: 'hash-1',
  walletId: 'wallet-1',
  playerId: 'player-1',
  roundId: 'round-1',
  gameId: 'game-1',
  kind,
  money: money('25.00'),
  referenceExternalTransactionId,
});

describe('WagerTransaction', () => {
  it('creates new public transactions as pending', () => {
    const transaction = WagerTransaction.create(props(WagerTransactionKind.Bet));

    expect(transaction.status).toBe(WagerTransactionStatus.Pending);
    expect(transaction.ledgerDirectionFor()).toBe(LedgerDirection.Debit);
  });

  it('requires references for refunds and rollbacks', () => {
    expect(() => WagerTransaction.create(props(WagerTransactionKind.Refund))).toThrow();
    expect(() => WagerTransaction.create(props(WagerTransactionKind.Rollback))).toThrow();
  });

  it('keeps opening transactions internal', () => {
    expect(() => WagerTransaction.create(props(WagerTransactionKind.Opening))).toThrow('internal');
  });

  it('maps rollback to the inverse direction of its reference', () => {
    const bet = WagerTransaction.create(props(WagerTransactionKind.Bet));
    const rollback = WagerTransaction.create(props(WagerTransactionKind.Rollback, 'external-1'));

    expect(rollback.ledgerDirectionFor(bet)).toBe(LedgerDirection.Credit);
  });

  it('does not allow transitions after a terminal state', () => {
    const transaction = WagerTransaction.create(props(WagerTransactionKind.Bet));
    transaction.reject(FailureCode.InsufficientBalance);

    expect(() => transaction.markProcessed(undefined, new Date())).toThrow(InvalidTransactionStateError);
    expect(transaction.status).toBe(WagerTransactionStatus.Rejected);
  });

  it('supports pending references before processing', () => {
    const transaction = WagerTransaction.create(props(WagerTransactionKind.Refund, 'external-1'));
    transaction.markPendingReference();

    expect(transaction.status).toBe(WagerTransactionStatus.PendingReference);
    expect(transaction.requiresReference()).toBe(true);
  });

  it('requires a resolved reference before processing a refund', () => {
    const transaction = WagerTransaction.create(props(WagerTransactionKind.Refund, 'external-1'));

    expect(() => transaction.markProcessed(undefined, new Date())).toThrow('resolved reference');
  });
});