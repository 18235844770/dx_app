import { request } from './http';
import { ReplayRecord, ReplayDetail } from '@/types/replay';

export interface MatchListResponse {
  data: ReplayRecord[];
  total: number;
}

export function getList(page: number, pageSize: number) {
  return request<MatchListResponse>({
    url: '/dxService/v1/match/list',
    method: 'GET',
    data: { page, pageSize }
  });
}

export function getDetail(matchId: number | string) {
  return request<ReplayDetail>({
    url: `/dxService/v1/match/${matchId}/replay`,
    method: 'GET'
  });
}
