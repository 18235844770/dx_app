import { useUserStore } from '@/store/user';
import { ApiResponse } from '@/types/api';

// const BASE_URL = '/API';
const BASE_URL = 'http://81.68.235.105:9080/api';

interface RequestOptions extends UniApp.RequestOptions {
  suppressAutoToast?: boolean;
}

const showErrorToast = (msg: string, suppress?: boolean) => {
  if (suppress) return;
  uni.showToast({ title: msg, icon: 'none' });
};

export async function request<T>(
  options: RequestOptions
): Promise<T> {
  const userStore = useUserStore();
  const token = userStore.token;
  const { suppressAutoToast, ...requestOptions } = options;

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + requestOptions.url,
      method: requestOptions.method ?? 'GET',
      data: requestOptions.data,
      header: {
        ...requestOptions.header,
        Authorization: token ? `Bearer ${token}` : ''
      },
      success(res) {
        const r = res.data as ApiResponse<T>;
        if (r.code === 0 || r.code === 200) {
            resolve(r.data);
        } else {
          showErrorToast(r.msg || '请求失败', suppressAutoToast);
          reject(r);
        }
      },
      fail(err) {
        showErrorToast('网络异常', suppressAutoToast);
        reject(err);
      }
    });
  });
}

