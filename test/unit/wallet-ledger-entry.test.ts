import { describe, expect, it } from 'bun:test';
import { Money } from '../../src/domain/money/money';
import {
  LedgerDirection,
  WalletLedgerEntry,
} from '../../src/domain/wallet/wallet-ledger-entry';

const brl = (amount: string): Money => Money.from({ amount, currency: 'BRL' });

describe('WalletLedgerEntry', () => {
  it('creates a balanced debit entry', () => {
    const entry = WalletLedgerEntry.create({
      id: 'ledger-1',
      walletId: 'wallet-1',
      transactionId: 'transaction-1',
      direction: LedgerDirection.Debit,
      money: brl('25.00'),
      balanceBefore: brl('100.00'),
      balanceAfter: brl('75.00'),
    });

    expect(entry.isBalanced()).toBe(true);
    expect(Object.isFrozen(entry)).toBe(false);
    expect(entry.balanceAfter.toString()).toBe('75.00');
  });

  it('rejects an inconsistent balance', () => {
    expect(() => WalletLedgerEntry.create({
      id: 'ledger-1',
      walletId: 'wallet-1',
      transactionId: 'transaction-1',
      direction: LedgerDirection.Credit,
      money: brl('25.00'),
      balanceBefore: brl('100.00'),
      balanceAfter: brl('120.00'),
    })).toThrow('Ledger entry is not balanced');
  });

  it('rejects a debit that would produce a negative balance', () => {
    expect(() => WalletLedgerEntry.create({
      id: 'ledger-1',
      walletId: 'wallet-1',
      transactionId: 'transaction-1',
      direction: LedgerDirection.Debit,
      money: brl('25.00'),
      balanceBefore: brl('20.00'),
      balanceAfter: brl('-5.00'),
    })).toThrow('Ledger entry balance cannot be negative');
  });

  it('rejects a movement with another currency', () => {
    expect(() => WalletLedgerEntry.create({
      id: 'ledger-1',
      walletId: 'wallet-1',
      transactionId: 'transaction-1',
      direction: LedgerDirection.Credit,
      money: Money.from({ amount: '25.00', currency: 'USD' }),
      balanceBefore: brl('100.00'),
      balanceAfter: brl('125.00'),
    })).toThrow('Ledger entry currencies must match');
  });
});