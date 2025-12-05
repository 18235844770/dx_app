import { request } from './http';
import {
  AgentDashboard,
  Invitee,
  ProfitRecord
} from '@/types/agent';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export function getDashboard() {
  return request<AgentDashboard>({
    url: '/dxService/v1/agent/dashboard',
    method: 'GET'
  });
}

export function getInvitees(page: number, pageSize = 20) {
  return request<PaginatedResponse<Invitee>>({
    url: '/dxService/v1/agent/invitees',
    method: 'GET',
    data: { page, pageSize }
  });
}

export function getProfits(page: number, pageSize = 20) {
  return request<PaginatedResponse<ProfitRecord>>({
    url: '/dxService/v1/agent/profits',
    method: 'GET',
    data: { page, pageSize }
  });
}
