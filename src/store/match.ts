import { defineStore } from 'pinia';
import { MatchStatus } from '@/types/match';

type MatchStateStatus = MatchStatus['status'] | 'idle';

export const useMatchStore = defineStore('match', {
  state: () => ({
    queueId: '',
    sceneId: 0,
    status: 'idle' as MatchStateStatus,
    tableId: '',
    matchId: '',
    joinedAt: '',
    estimatedTime: 0,
    startedAt: 0
  }),
  actions: {
    start(sceneId: number | string, queueId: string) {
      this.sceneId = typeof sceneId === 'string' ? Number(sceneId) : sceneId;
      this.queueId = queueId;
      this.status = 'queued';
      this.startedAt = Date.now();
    },
    updateFromServer(st: MatchStatus) {
      this.status = st.status;
      if (st.queueId) this.queueId = st.queueId;
      if (typeof st.sceneId === 'number') this.sceneId = st.sceneId;
      if (st.tableId) this.tableId = String(st.tableId);
      if (st.matchId) this.matchId = String(st.matchId);
      if (st.joinedAt) this.joinedAt = st.joinedAt;
      if (typeof st.estimatedTime === 'number') {
        this.estimatedTime = st.estimatedTime;
      }
    },
    reset() {
      this.queueId = '';
      this.sceneId = 0;
      this.status = 'idle';
      this.tableId = '';
      this.matchId = '';
      this.joinedAt = '';
      this.estimatedTime = 0;
      this.startedAt = 0;
    }
  }
});

