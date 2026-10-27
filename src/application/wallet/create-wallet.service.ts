import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Money } from '../../domain/money/money';
import { WalletBalanceChanged } from '../../domain/messaging/integration-events';
import { OutboxMessage } from '../../domain/messaging/outbox-message';
import { WalletLedgerEntry, LedgerDirection } from '../../domain/wallet/wallet-ledger-entry';
import { Wallet } from '../../domain/wallet/wallet';
import { WagerTransactionKind, WagerTransactionStatus } from '../../domain/wallet/wager-transaction';
import { LedgerEntryEntity } from '../../infrastructure/persistence/postgres/entities/ledger-entry.entity';
import { OutboxMessageEntity } from '../../infrastructure/persistence/postgres/entities/outbox-message.entity';
import { WalletEntity } from '../../infrastructure/persistence/postgres/entities/wallet.entity';
import { WagerTransactionEntity } from '../../infrastructure/persistence/postgres/entities/wager-transaction.entity';

const createWalletSchema = z.object({
  playerId: z.string().trim().min(1),
  initialBalance: z.object({
    amount: z.string(),
    currency: z.string(),
  }),
});

export interface WalletResponse {
  id: string;
  playerId: string;
  balance: { amount: string; currency: string };
  version: number;
}

@Injectable()
export class CreateWalletService {
  constructor(private readonly orm: MikroORM) {}

  async create(input: unknown): Promise<WalletResponse> {
    const parsed = createWalletSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException('Invalid wallet payload');

    let money: Money;
    try {
      money = Money.from(parsed.data.initialBalance);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid money');
    }

    const wallet = Wallet.open({ id: randomUUID(), playerId: parsed.data.playerId, initialBalance: money });

    try {
      return await this.orm.em.transactional(async (em) => {
        em.persist(em.create(WalletEntity, {
          id: wallet.id,
          playerId: wallet.playerId,
          currency: wallet.currency,
          balance: wallet.balance.toString(),
          version: wallet.version,
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt,
        }));
        await em.flush();

        if (money.isPositive()) {
          await this.persistOpening(em, wallet);
        }

        await em.flush();
        return this.toResponse(wallet);
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'UniqueConstraintViolationException') {
        throw new ConflictException('A wallet already exists for this player and currency');
      }
      throw error;
    }
  }

  async get(walletId: string): Promise<WalletResponse> {
    const entity = await this.orm.em.findOne(WalletEntity, { id: walletId });
    if (!entity) throw new NotFoundException('Wallet not found');
    return {
      id: entity.id,
      playerId: entity.playerId,
      balance: { amount: entity.balance, currency: entity.currency },
      version: entity.version,
    };
  }

  private async persistOpening(
    em: Parameters<Parameters<MikroORM['em']['transactional']>[0]>[0],
    wallet: Wallet,
  ): Promise<void> {
    const transactionId = randomUUID();
    const externalId = `opening:${wallet.id}`;
    em.persist(em.create(WagerTransactionEntity, {
      id: transactionId,
      providerId: 'internal',
      externalTransactionId: externalId,
      idempotencyKey: externalId,
      payloadHash: 'internal-opening',
      walletId: wallet.id,
      playerId: wallet.playerId,
      roundId: 'internal',
      gameId: 'internal',
      kind: WagerTransactionKind.Opening,
      amount: wallet.balance.toString(),
      currency: wallet.currency,
      status: WagerTransactionStatus.Processed,
      createdAt: wallet.createdAt,
      processedAt: wallet.createdAt,
    }));
    await em.flush();

    const entry = WalletLedgerEntry.create({
      id: randomUUID(),
      walletId: wallet.id,
      transactionId,
      direction: LedgerDirection.Credit,
      money: wallet.balance,
      balanceBefore: Money.zero(wallet.currency),
      balanceAfter: wallet.balance,
      createdAt: wallet.createdAt,
    });
    em.persist(em.create(LedgerEntryEntity, {
      id: entry.id,
      walletId: entry.walletId,
      transactionId: entry.transactionId,
      direction: entry.direction,
      amount: entry.money.toString(),
      currency: entry.money.currency,
      balanceBefore: entry.balanceBefore.toString(),
      balanceAfter: entry.balanceAfter.toString(),
      createdAt: entry.createdAt,
    }));

    const event = new WalletBalanceChanged({
      eventId: randomUUID(),
      aggregateId: wallet.id,
      correlationId: transactionId,
      causationId: transactionId,
      occurredAt: wallet.createdAt,
      data: {
        walletId: wallet.id,
        transactionId,
        direction: entry.direction,
        money: entry.money.toJSON(),
        balanceBefore: entry.balanceBefore.toJSON(),
        balanceAfter: entry.balanceAfter.toJSON(),
        walletVersion: wallet.version,
      },
    });
    const outbox = OutboxMessage.enqueue(event);
    em.persist(em.create(OutboxMessageEntity, {
      id: outbox.id,
      aggregateId: outbox.aggregateId,
      eventType: outbox.eventType,
      payload: outbox.payload,
      occurredAt: outbox.occurredAt,
      attempts: outbox.attempts,
    }));
  }

  private toResponse(wallet: Wallet): WalletResponse {
    return {
      id: wallet.id,
      playerId: wallet.playerId,
      balance: wallet.balance.toJSON(),
      version: wallet.version,
    };
  }
}