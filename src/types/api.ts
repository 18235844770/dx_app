export interface ApiResponse<T> {
  code: number;      // 0/200 表示成功
  msg: string;
  data: T;
  traceId?: string;
}

