import { defineStore } from 'pinia';
import {
  AgentDashboard,
  Invitee,
  ProfitRecord
} from '@/types/agent';
import * as agentApi from '@/services/agent.api';

export const useAgentStore = defineStore('agent', {
  state: () => ({
    dashboard: null as AgentDashboard | null,
    invitees: [] as Invitee[],
    inviteePage: 1,
    inviteeTotal: 0,
    inviteeLoading: false,
    inviteeHasMore: true,
    profits: [] as ProfitRecord[],
    profitPage: 1,
    profitTotal: 0,
    profitLoading: false,
    profitHasMore: true
  }),
  actions: {
    async loadDashboard() {
      this.dashboard = await agentApi.getDashboard();
    },
    async loadMoreInvitees() {
      if (!this.inviteeHasMore || this.inviteeLoading) return;
      this.inviteeLoading = true;
      try {
        const res = await agentApi.getInvitees(this.inviteePage);
        this.invitees = [...this.invitees, ...res.data];
        this.inviteeTotal = res.total;
        this.inviteePage += 1;
        this.inviteeHasMore = this.invitees.length < res.total;
      } finally {
        this.inviteeLoading = false;
      }
    },
    async loadMoreProfits() {
      if (!this.profitHasMore || this.profitLoading) return;
      this.profitLoading = true;
      try {
        const res = await agentApi.getProfits(this.profitPage);
        this.profits = [...this.profits, ...res.data];
        this.profitTotal = res.total;
        this.profitPage += 1;
        this.profitHasMore = this.profits.length < res.total;
      } finally {
        this.profitLoading = false;
      }
    },
    reset() {
      this.dashboard = null;
      this.invitees = [];
      this.inviteePage = 1;
      this.inviteeTotal = 0;
      this.inviteeHasMore = true;
      this.profits = [];
      this.profitPage = 1;
      this.profitTotal = 0;
      this.profitHasMore = true;
    }
  }
});

