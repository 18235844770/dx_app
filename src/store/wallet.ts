import { defineStore } from 'pinia';
import { WalletApiModel, WalletInfo } from '@/types/wallet';
import * as walletApi from '@/services/wallet.api';
import { useUserStore } from './user';

const normalizeWallet = (wallet: WalletApiModel): WalletInfo => ({
  userId: wallet.UserID,
  balanceTotal: wallet.BalanceTotal,
  balanceAvailable: wallet.BalanceAvailable,
  balanceFrozen: wallet.BalanceFrozen,
  totalRecharge: wallet.TotalRecharge,
  totalWin: wallet.TotalWin,
  totalConsume: wallet.TotalConsume,
  totalRake: wallet.TotalRake,
  updatedAt: wallet.UpdatedAt
});

export const useWalletStore = defineStore('wallet', {
  state: () => ({
    info: null as WalletInfo | null
  }),
  actions: {
    async loadInfo() {
        const userStore = useUserStore();
        const userId = userStore.profile?.id;
        if (!userId) return;
        const res = await walletApi.getWallet(userId);
        this.info = res?.wallet ? normalizeWallet(res.wallet) : null;
    }
  }
});

