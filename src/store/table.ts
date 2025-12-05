import { defineStore } from 'pinia';
import { TableState, LogItem } from '@/types/game';

export const useTableStore = defineStore('table', {
  state: () => ({
    tableId: '',
    wsConnected: false,
    state: null as TableState | null
  }),
  actions: {
    applyState(s: TableState) {
      this.state = s;
    },
    appendLog(log: LogItem) {
      if (!this.state) return;
      const logs = this.state.logs || [];
      this.state = {
        ...this.state,
        logs: [...logs, log].slice(-50)
      };
    },
    reset() {
      this.tableId = '';
      this.wsConnected = false;
      this.state = null;
    }
  }
});

