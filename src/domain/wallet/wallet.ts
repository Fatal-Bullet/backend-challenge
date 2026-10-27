import { Money } from '../money/money';

export interface WalletState {
  id: string;
  playerId: string;
  currency: string;
  balance: Money;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export type WalletBalanceChange = {
  direction: 'DEBIT' | 'CREDIT';
  money: Money;
  balanceBefore: Money;
  balanceAfter: Money;
  walletVersion: number;
  occurredAt: Date;
};

export class Wallet {
  private constructor(
    public readonly id: string,
    public readonly playerId: string,
    public readonly currency: string,
    private _balance: Money,
    private _version: number,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static open(props: { id: string; playerId: string; initialBalance: Money }): Wallet {
    if (!props.id.trim() || !props.playerId.trim()) {
      throw new Error('Wallet id and playerId are required');
    }
    if (props.initialBalance.isNegative()) {
      throw new Error('Wallet initial balance cannot be negative');
    }

    const now = new Date();
    return new Wallet(
      props.id,
      props.playerId,
      props.initialBalance.currency,
      props.initialBalance,
      1,
      now,
      now,
    );
  }

  static rehydrate(state: WalletState): Wallet {
    return new Wallet(
      state.id,
      state.playerId,
      state.currency,
      state.balance,
      state.version,
      state.createdAt,
      state.updatedAt,
    );
  }

  get balance(): Money { return this._balance; }
  get version(): number { return this._version; }
  get updatedAt(): Date { return this._updatedAt; }

  debit(money: Money, at = new Date()): WalletBalanceChange {
    this.assertPositive(money);
    this.assertSameCurrency(money);
    if (this._balance.isLessThan(money)) {
      throw new Error('Wallet balance is insufficient');
    }

    return this.applyChange('DEBIT', money, this._balance.subtract(money), at);
  }

  credit(money: Money, at = new Date()): WalletBalanceChange {
    this.assertPositive(money);
    this.assertSameCurrency(money);
    return this.applyChange('CREDIT', money, this._balance.add(money), at);
  }

  private applyChange(
    direction: WalletBalanceChange['direction'],
    money: Money,
    balanceAfter: Money,
    occurredAt: Date,
  ): WalletBalanceChange {
    const balanceBefore = this._balance;
    this._balance = balanceAfter;
    this._version += 1;
    this._updatedAt = occurredAt;

    return {
      direction,
      money,
      balanceBefore,
      balanceAfter,
      walletVersion: this._version,
      occurredAt,
    };
  }

  private assertPositive(money: Money): void {
    if (!money.isPositive()) throw new Error('Wallet movement must be positive');
  }

  private assertSameCurrency(money: Money): void {
    if (money.currency !== this.currency) throw new Error('Wallet currencies must match');
  }
}