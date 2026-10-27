import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { entities } from './src/infrastructure/persistence/postgres/entities/index';

export default defineConfig({
  clientUrl: process.env.DATABASE_URL,
  entities,
  extensions: [Migrator],
  migrations: {
    path: './src/database/migrations',
    pathTs: './src/database/migrations',
  },
});