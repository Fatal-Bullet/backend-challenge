import { describe, expect, it } from 'bun:test';
import { Money } from '../../src/domain/money/money';

describe('Money', () => {
  it('keeps a fixed two-decimal representation', () => {
    expect(Money.from({ amount: '25', currency: 'BRL' }).toJSON()).toEqual({
      amount: '25.00',
      currency: 'BRL',
    });
  });

  it('does not allow invalid precision', () => {
    expect(() => Money.from({ amount: '1.001', currency: 'BRL' })).toThrow();
  });

  it('rejects operations across currencies', () => {
    const brl = Money.from({ amount: '1.00', currency: 'BRL' });
    const usd = Money.from({ amount: '1.00', currency: 'USD' });
    expect(() => brl.add(usd)).toThrow();
  });
});