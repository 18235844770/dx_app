import { request } from './http';
import { WalletResponse } from '@/types/wallet';

export function getWallet(userId: number | string) {
  return request<WalletResponse>({
    url: '/dxService/v1/wallet',
    method: 'GET',
    data: { userId }
  });
}

