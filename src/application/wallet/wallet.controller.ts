import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateWalletService } from './create-wallet.service';

@Controller('wallets')
export class WalletController {
  constructor(private readonly wallets: CreateWalletService) {}

  @Post()
  create(@Body() body: unknown) {
    return this.wallets.create(body);
  }

  @Get(':walletId')
  get(@Param('walletId') walletId: string) {
    return this.wallets.get(walletId);
  }
}