import { request } from './http';
import {
  LoginResult,
  UpdateProfilePayload,
  ServerUserProfile
} from '@/types/user';

export function sendLoginCode(phone: string) {
  return request<{ msg: string }>({
    url: '/dxService/v1/auth/sms/send',
    method: 'POST',
    data: { phone }
  });
}

export function login(phone: string, code: string, inviteCode?: string) {
  return request<LoginResult>({
    url: '/dxService/v1/auth/sms/login',
    method: 'POST',
    data: {
      phone,
      code,
      inviteCode
    }
  });
}

export function getProfile() {
  return request<ServerUserProfile>({
    url: '/dxService/v1/user/profile',
    method: 'GET'
  });
}

export function updateProfile(payload: UpdateProfilePayload) {
  return request<ServerUserProfile>({
    url: '/dxService/v1/user/profile',
    method: 'PUT',
    data: payload
  });
}

