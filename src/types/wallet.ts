export interface WalletApiModel {
  UserID: number;
  BalanceTotal: number;
  BalanceAvailable: number;
  BalanceFrozen: number;
  TotalRecharge: number;
  TotalWin: number;
  TotalConsume: number;
  TotalRake: number;
  UpdatedAt: string;
}

export interface WalletInfo {
  userId: number;
  balanceTotal: number;
  balanceAvailable: number;
  balanceFrozen: number;
  totalRecharge: number;
  totalWin: number;
  totalConsume: number;
  totalRake: number;
  updatedAt: string;
}

export interface WalletResponse {
  wallet: WalletApiModel;
}

