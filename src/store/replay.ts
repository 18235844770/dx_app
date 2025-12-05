import { defineStore } from 'pinia';
import { ReplayRecord, ReplayDetail } from '@/types/replay';
import * as replayApi from '@/services/replay.api';

export const useReplayStore = defineStore('replay', {
  state: () => ({
    records: [] as ReplayRecord[],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
    detail: null as ReplayDetail | null,
    detailLoading: false
  }),
  actions: {
    async fetchList(reset = false) {
      if (this.loading) return;
      if (reset) {
        this.page = 1;
        this.records = [];
      }
      this.loading = true;
      try {
        const res = await replayApi.getList(this.page, this.pageSize);
        this.total = res.total;
        this.records = reset ? res.data : [...this.records, ...res.data];
        this.page += 1;
      } finally {
        this.loading = false;
      }
    },
    async fetchDetail(matchId: number | string) {
      if (this.detailLoading) return;
      this.detailLoading = true;
      try {
        this.detail = await replayApi.getDetail(matchId);
      } finally {
        this.detailLoading = false;
      }
    },
    resetDetail() {
      this.detail = null;
    }
  }
});

