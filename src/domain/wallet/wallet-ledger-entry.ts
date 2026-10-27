import { Money } from '../money/money';

export enum LedgerDirection {
  Debit = 'DEBIT',
  Credit = 'CREDIT',
}

export interface LedgerEntryState {
  id: string;
  walletId: string;
  transactionId: string;
  direction: LedgerDirection;
  money: Money;
  balanceBefore: Money;
  balanceAfter: Money;
  createdAt: Date;
}

export interface CreateLedgerEntryProps {
  id: string;
  walletId: string;
  transactionId: string;
  direction: LedgerDirection;
  money: Money;
  balanceBefore: Money;
  balanceAfter: Money;
  createdAt?: Date;
}

export class WalletLedgerEntry {
  private constructor(
    public readonly id: string,
    public readonly walletId: string,
    public readonly transactionId: string,
    public readonly direction: LedgerDirection,
    public readonly money: Money,
    public readonly balanceBefore: Money,
    public readonly balanceAfter: Money,
    public readonly createdAt: Date,
  ) {}

  static create(props: CreateLedgerEntryProps): WalletLedgerEntry {
    if (!props.id.trim() || !props.walletId.trim() || !props.transactionId.trim()) {
      throw new Error('Ledger entry identifiers are required');
    }
    if (!props.money.isPositive()) {
      throw new Error('Ledger entry amount must be positive');
    }
    if (props.balanceBefore.currency !== props.money.currency ||
        props.balanceAfter.currency !== props.money.currency) {
      throw new Error('Ledger entry currencies must match');
    }
    if (props.balanceAfter.isNegative()) {
      throw new Error('Ledger entry balance cannot be negative');
    }

    const expectedBalance = props.direction === LedgerDirection.Debit
      ? props.balanceBefore.subtract(props.money)
      : props.balanceBefore.add(props.money);

    if (!expectedBalance.equals(props.balanceAfter)) {
      throw new Error('Ledger entry is not balanced');
    }

    return new WalletLedgerEntry(
      props.id,
      props.walletId,
      props.transactionId,
      props.direction,
      props.money,
      props.balanceBefore,
      props.balanceAfter,
      props.createdAt ?? new Date(),
    );
  }

  static rehydrate(state: LedgerEntryState): WalletLedgerEntry {
    return new WalletLedgerEntry(
      state.id,
      state.walletId,
      state.transactionId,
      state.direction,
      state.money,
      state.balanceBefore,
      state.balanceAfter,
      state.createdAt,
    );
  }

  isBalanced(): boolean {
    const expectedBalance = this.direction === LedgerDirection.Debit
      ? this.balanceBefore.subtract(this.money)
      : this.balanceBefore.add(this.money);

    return expectedBalance.equals(this.balanceAfter);
  }
}