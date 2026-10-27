import { describe, expect, it } from 'bun:test';
import { Money } from '../../src/domain/money/money';
import { Wallet } from '../../src/domain/wallet/wallet';

const brl = (amount: string): Money => Money.from({ amount, currency: 'BRL' });

describe('Wallet', () => {
  it('opens with version one and the initial balance', () => {
    const wallet = Wallet.open({ id: 'wallet-1', playerId: 'player-1', initialBalance: brl('100.00') });

    expect(wallet.balance.toJSON()).toEqual({ amount: '100.00', currency: 'BRL' });
    expect(wallet.version).toBe(1);
  });

  it('debits and returns the ledger-ready balance change', () => {
    const wallet = Wallet.open({ id: 'wallet-1', playerId: 'player-1', initialBalance: brl('100.00') });
    const change = wallet.debit(brl('25.00'));

    expect(change.direction).toBe('DEBIT');
    expect(change.balanceBefore.toString()).toBe('100.00');
    expect(change.balanceAfter.toString()).toBe('75.00');
    expect(wallet.version).toBe(2);
  });

  it('rejects insufficient debit without changing state', () => {
    const wallet = Wallet.open({ id: 'wallet-1', playerId: 'player-1', initialBalance: brl('20.00') });

    expect(() => wallet.debit(brl('25.00'))).toThrow('Wallet balance is insufficient');
    expect(wallet.balance.toString()).toBe('20.00');
    expect(wallet.version).toBe(1);
  });

  it('rejects a movement in another currency', () => {
    const wallet = Wallet.open({ id: 'wallet-1', playerId: 'player-1', initialBalance: brl('20.00') });
    const usd = Money.from({ amount: '1.00', currency: 'USD' });

    expect(() => wallet.credit(usd)).toThrow('Wallet currencies must match');
  });
});