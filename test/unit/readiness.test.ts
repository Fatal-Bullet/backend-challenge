import { describe, expect, it } from 'bun:test';
import { ConfigService } from '@nestjs/config';
import { ReadinessService } from '../../src/health/readiness.service';

const config = new ConfigService({ SQS_QUEUE_URL: 'http://localhost:4566/queue.fifo' });

describe('ReadinessService', () => {
  it('reports PostgreSQL and SQS as ready', async () => {
    const orm = { em: { getConnection: () => ({ execute: async () => undefined }) } } as never;
    const sqsClient = { send: async () => ({}) } as never;
    const service = new ReadinessService(orm, sqsClient, config);

    await expect(service.check()).resolves.toEqual({
      status: 'ok',
      checks: { postgres: 'ok', sqs: 'ok' },
    });
  });

  it('fails readiness when PostgreSQL is unavailable', async () => {
    const orm = {
      em: { getConnection: () => ({ execute: async () => { throw new Error('database down'); } }) },
    } as never;
    const sqsClient = { send: async () => ({}) } as never;
    const service = new ReadinessService(orm, sqsClient, config);

    await expect(service.check()).rejects.toMatchObject({
      response: { status: 'error', checks: { postgres: 'error', sqs: 'ok' } },
    });
  });
});