import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { HealthController } from './health/health.controller';
import { ReadinessService } from './health/readiness.service';
import { CreateWalletService } from './application/wallet/create-wallet.service';
import { WalletController } from './application/wallet/wallet.controller';
import { SqsModule } from './infrastructure/messaging/sqs/sqs.module';
import { entities } from './infrastructure/persistence/postgres/entities';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MikroOrmModule.forRootAsync({
      driver: PostgreSqlDriver,
      useFactory: (configService: ConfigService) => ({
        clientUrl: configService.getOrThrow<string>('DATABASE_URL'),
        driver: PostgreSqlDriver,
        entities,
        migrations: { path: './dist/database/migrations' },
      }),
      inject: [ConfigService],
    }),
    SqsModule,
  ],
  controllers: [HealthController, WalletController],
  providers: [ReadinessService, CreateWalletService],
})
export class AppModule {}