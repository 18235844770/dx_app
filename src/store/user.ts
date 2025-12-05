import { defineStore } from 'pinia';
import {
  UserProfile,
  UpdateProfilePayload,
  ServerUserProfile,
  UserStatus
} from '@/types/user';
import {
  login as loginApi,
  getProfile as getProfileApi,
  updateProfile as updateProfileApi
} from '@/services/user.api';

interface UserState {
  token: string;
  tokenExpiresAt: number;
  profile: UserProfile | null;
  banned: boolean;
  banReason: string;
}

interface UserGetters {
  isLoggedIn(state: UserState): boolean;
}

const STATUS_WHITELIST: readonly UserStatus[] = [
  'normal',
  'banned',
  'suspended',
  'pending'
];

function normalizeStatus(status?: string): UserStatus {
  const normalized = (status ?? 'normal').toLowerCase() as UserStatus;
  return STATUS_WHITELIST.includes(normalized) ? normalized : 'normal';
}

function mapServerUser(user: ServerUserProfile): UserProfile {
  const status = normalizeStatus(user.Status);
  return {
    id: user.ID,
    phone: user.Phone || '',
    nickname: user.Nickname || '',
    status,
    avatar: user.Avatar || '',
    locationCity: user.LocationCity || '',
    inviteCode: user.InviteCode ?? undefined,
    createdAt: user.CreatedAt,
    updatedAt: user.UpdatedAt,
    banned: status === 'banned',
    banReason: user.BanReason || '',
    gpsLat: user.GPSLat,
    gpsLng: user.GPSLng,
    bindAgentId:
      user.BindAgentID !== undefined ? user.BindAgentID : undefined,
    agentPath: user.AgentPath ?? undefined
  };
}

function parseExpireAt(expireAt?: string): number | undefined {
  if (!expireAt) return undefined;
  const timestamp = Date.parse(expireAt);
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

interface UserActions {
  setToken(t: string, expireValue?: number): void;
  login(phone: string, code: string, inviteCode?: string): Promise<void>;
  loadProfile(): Promise<void>;
  updateProfile(payload: UpdateProfilePayload): Promise<UserProfile>;
  logout(): void;
}

export const useUserStore = defineStore<'user', UserState, UserGetters, UserActions>('user', {
  state: (): UserState => ({
    token: '',
    tokenExpiresAt: 0,
    profile: null,
    banned: false,
    banReason: ''
  }),
  getters: {
    isLoggedIn: (state) => !!state.token
  },
  actions: {
    setToken(t, expireValue) {
      this.token = t;
      if (!expireValue || Number.isNaN(expireValue)) {
        this.tokenExpiresAt = 0;
        return;
      }
      this.tokenExpiresAt =
        expireValue > 1e12
          ? expireValue
          : Date.now() + Math.max(expireValue, 0) * 1000;
    },
    async login(phone, code, inviteCode) {
      const res = await loginApi(phone, code, inviteCode);
      const expireAt = parseExpireAt(res.expireAt);
      this.setToken(res.token, expireAt);
      const profile = mapServerUser(res.user);
      this.profile = profile;
      this.banned = profile.status === 'banned';
      this.banReason = profile.banReason || '';
    },
    async loadProfile() {
      const profile = await getProfileApi();
      const normalized = mapServerUser(profile);
      this.profile = normalized;
      this.banned = normalized.status === 'banned';
      this.banReason = normalized.banReason || '';
    },
    async updateProfile(payload) {
      const profile = await updateProfileApi(payload);
      const normalized = mapServerUser(profile);
      this.profile = normalized;
      this.banned = normalized.status === 'banned';
      this.banReason = normalized.banReason || '';
      return normalized;
    },
    logout() {
      this.token = '';
      this.tokenExpiresAt = 0;
      this.profile = null;
      this.banned = false;
      this.banReason = '';
      uni.reLaunch({ url: '/pages/login/index' });
    }
  },
  unistorage: {
    key: 'user',
    paths: ['token', 'tokenExpiresAt', 'profile', 'banned', 'banReason']
  }
});
