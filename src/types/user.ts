export type UserStatus = 'normal' | 'banned' | 'suspended' | 'pending';

export interface UserProfile {
  id: number;
  phone: string;
  nickname: string;
  status: UserStatus;
  avatar?: string;
  locationCity?: string;
  inviteCode?: string;
  createdAt?: string;
  updatedAt?: string;
  banned?: boolean;
  banReason?: string;
  gpsLat?: number;
  gpsLng?: number;
  bindAgentId?: number | null;
  agentPath?: string;
}

export interface ServerUserProfile {
  ID: number;
  Phone: string;
  Nickname: string;
  Avatar?: string;
  LocationCity?: string;
  InviteCode?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
  Status?: string;
  GPSLat?: number;
  GPSLng?: number;
  BindAgentID?: number | null;
  AgentPath?: string;
  BanReason?: string;
}

export interface LoginResult {
  token: string;
  expireAt?: string;
  user: ServerUserProfile;
}

export interface UpdateProfilePayload {
  nickname?: string;
  avatar?: string;
  locationCity?: string;
}

