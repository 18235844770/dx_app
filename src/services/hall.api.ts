import { request } from './http';
import { ScenesResponse } from '@/types/hall';

export function getScenes() {
  return request<ScenesResponse>({
    url: '/dxService/v1/scenes',
    method: 'GET'
  });
}
