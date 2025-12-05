export interface AgentDashboard {
  inviteCode: string;
  totalInvited: number;
  activeInvited: number;
  totalProfit: number;
  todayProfit: number;
  level: string;
  levelList?: Array<{ level: string; rate: number }>;
}

export interface Invitee {
  userId: number;
  nickname: string;
  phone: string;
  status: string;
  registeredAt: string;
}

export interface ProfitRecord {
  id: number;
  amount: number;
  sourceUser: string;
  date: string;
  note?: string;
}

