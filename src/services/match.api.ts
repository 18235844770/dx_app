import { request } from './http';
import {
  JoinMatchPayload,
  JoinMatchResponse,
  MatchStatus
} from '@/types/match';

export function joinQueue(payload: JoinMatchPayload) {
  return request<JoinMatchResponse>({
    url: '/dxService/v1/match/join',
    method: 'POST',
    data: payload,
    suppressAutoToast: true
  });
}

export function status(sceneId: number) {
  return request<MatchStatus>({
    url: '/dxService/v1/match/status',
    method: 'GET',
    data: { sceneId }
  });
}

export function cancel(sceneId: number) {
  return request<{ status: string }>({
    url: '/dxService/v1/match/cancel',
    method: 'POST',
    data: { sceneId }
  });
}
