import { Migration } from '@mikro-orm/migrations';

export class Migration20261027135030_InitPersistenceSchema extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "inbox_messages" ("message_id" varchar(255) not null, "consumer_name" varchar(255) not null, "payload_hash" varchar(128) not null, "received_at" timestamptz not null, "processed_at" timestamptz null, constraint "inbox_messages_pkey" primary key ("message_id", "consumer_name"));`);
    this.addSql(`alter table "inbox_messages" add constraint "inbox_messages_consumer_name_message_id_unique" unique ("consumer_name", "message_id");`);

    this.addSql(`create table "wallet_ledger_entries" ("id" uuid not null, "wallet_id" uuid not null, "transaction_id" uuid not null, "direction" varchar(10) not null, "amount" numeric(20,2) not null, "currency" varchar(3) not null, "balance_before" numeric(20,2) not null, "balance_after" numeric(20,2) not null, "created_at" timestamptz not null, constraint "wallet_ledger_entries_pkey" primary key ("id"));`);
    this.addSql(`create index "wallet_ledger_entries_wallet_id_created_at_id_index" on "wallet_ledger_entries" ("wallet_id", "created_at", "id");`);
    this.addSql(`alter table "wallet_ledger_entries" add constraint "wallet_ledger_entries_wallet_id_transaction_id_unique" unique ("wallet_id", "transaction_id");`);

    this.addSql(`create table "outbox_messages" ("id" uuid not null, "aggregate_id" uuid not null, "event_type" varchar(120) not null, "payload" jsonb not null, "occurred_at" timestamptz not null, "attempts" int not null default 0, "next_attempt_at" timestamptz null, "published_at" timestamptz null, constraint "outbox_messages_pkey" primary key ("id"));`);
    this.addSql(`create index "outbox_messages_published_at_next_attempt_at_index" on "outbox_messages" ("published_at", "next_attempt_at");`);

    this.addSql(`create table "wager_transactions" ("id" uuid not null, "provider_id" varchar(255) not null, "external_transaction_id" varchar(255) not null, "idempotency_key" varchar(512) not null, "payload_hash" varchar(128) not null, "wallet_id" uuid not null, "player_id" varchar(255) not null, "round_id" varchar(255) not null, "game_id" varchar(255) not null, "kind" varchar(20) not null, "amount" numeric(20,2) not null, "currency" varchar(3) not null, "reference_external_transaction_id" varchar(255) null, "status" varchar(30) not null, "reference_transaction_id" uuid null, "failure_code" varchar(80) null, "created_at" timestamptz not null, "processed_at" timestamptz null, constraint "wager_transactions_pkey" primary key ("id"));`);
    this.addSql(`create index "wager_transactions_wallet_id_status_index" on "wager_transactions" ("wallet_id", "status");`);
    this.addSql(`alter table "wager_transactions" add constraint "wager_transactions_idempotency_key_unique" unique ("idempotency_key");`);
    this.addSql(`alter table "wager_transactions" add constraint "wager_transactions_provider_id_external_transaction_id_unique" unique ("provider_id", "external_transaction_id");`);

    this.addSql(`create table "wallets" ("id" uuid not null, "player_id" varchar(255) not null, "currency" varchar(3) not null, "balance" numeric(20,2) not null, "version" int not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "wallets_pkey" primary key ("id"));`);
    this.addSql(`alter table "wallets" add constraint "wallets_player_id_currency_unique" unique ("player_id", "currency");`);
    this.addSql(`alter table "wallets" add constraint "wallets_balance_non_negative_check" check ("balance" >= 0);`);

    this.addSql(`alter table "wager_transactions" add constraint "wager_transactions_amount_positive_check" check ("amount" > 0);`);
    this.addSql(`alter table "wager_transactions" add constraint "wager_transactions_kind_check" check ("kind" in ('OPENING', 'BET', 'WIN', 'LOSS', 'REFUND', 'ROLLBACK'));`);
    this.addSql(`alter table "wager_transactions" add constraint "wager_transactions_status_check" check ("status" in ('PENDING', 'PENDING_REFERENCE', 'PROCESSED', 'REJECTED', 'FAILED'));`);
    this.addSql(`alter table "wager_transactions" add constraint "wager_transactions_wallet_fk" foreign key ("wallet_id") references "wallets" ("id") on update cascade on delete restrict;`);
    this.addSql(`alter table "wager_transactions" add constraint "wager_transactions_reference_fk" foreign key ("reference_transaction_id") references "wager_transactions" ("id") on update cascade on delete restrict;`);

    this.addSql(`alter table "wallet_ledger_entries" add constraint "wallet_ledger_entries_amount_positive_check" check ("amount" > 0);`);
    this.addSql(`alter table "wallet_ledger_entries" add constraint "wallet_ledger_entries_balances_non_negative_check" check ("balance_before" >= 0 and "balance_after" >= 0);`);
    this.addSql(`alter table "wallet_ledger_entries" add constraint "wallet_ledger_entries_direction_check" check ("direction" in ('DEBIT', 'CREDIT'));`);
    this.addSql(`alter table "wallet_ledger_entries" add constraint "wallet_ledger_entries_wallet_fk" foreign key ("wallet_id") references "wallets" ("id") on update cascade on delete restrict;`);
    this.addSql(`alter table "wallet_ledger_entries" add constraint "wallet_ledger_entries_transaction_fk" foreign key ("transaction_id") references "wager_transactions" ("id") on update cascade on delete restrict;`);
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "wallet_ledger_entries" cascade;');
    this.addSql('drop table if exists "wager_transactions" cascade;');
    this.addSql('drop table if exists "outbox_messages" cascade;');
    this.addSql('drop table if exists "inbox_messages" cascade;');
    this.addSql('drop table if exists "wallets" cascade;');
  }

}
