import { SQSClient } from '@aws-sdk/client-sqs';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const SQS_CLIENT = Symbol('SQS_CLIENT');

@Module({
  providers: [
    {
      provide: SQS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): SQSClient => {
        const endpoint = configService.get<string>('AWS_ENDPOINT_URL');

        return new SQSClient({
          region: configService.getOrThrow<string>('AWS_REGION'),
          endpoint,
          credentials: {
            accessKeyId: configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
            secretAccessKey: configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
          },
        });
      },
    },
  ],
  exports: [SQS_CLIENT],
})
export class SqsModule {}