import Decimal from 'decimal.js';

export interface MoneyProps {
  amount: string;
  currency: string;
}

export class Money {
  private constructor(
    private readonly value: Decimal,
    public readonly currency: string,
  ) {}

  static from(props: MoneyProps): Money {
    if (!/^-?\d+(?:\.\d{1,2})?$/.test(props.amount)) {
      throw new Error('Money amount must be a decimal string with at most two places');
    }
    if (!/^[A-Z]{3}$/.test(props.currency)) {
      throw new Error('Money currency must be an ISO-4217 code');
    }

    const value = new Decimal(props.amount);
    if (!value.isFinite()) throw new Error('Money amount must be finite');
    return new Money(value.toDecimalPlaces(2), props.currency);
  }

  static zero(currency: string): Money {
    return Money.from({ amount: '0.00', currency });
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.from({ amount: this.value.plus(other.value).toFixed(2), currency: this.currency });
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.from({ amount: this.value.minus(other.value).toFixed(2), currency: this.currency });
  }

  negate(): Money {
    return Money.from({ amount: this.value.negated().toFixed(2), currency: this.currency });
  }

  isZero(): boolean { return this.value.isZero(); }
  isPositive(): boolean { return this.value.isPositive(); }
  isNegative(): boolean { return this.value.isNegative(); }

  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.value.lessThan(other.value);
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.value.equals(other.value);
  }

  toJSON(): MoneyProps { return { amount: this.value.toFixed(2), currency: this.currency }; }
  toString(): string { return this.value.toFixed(2); }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) throw new Error('Money currencies must match');
  }
}