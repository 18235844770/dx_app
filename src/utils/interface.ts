import { AxiosResponse } from "axios";

// 请求返回结果
export interface IHttpResponse<T = unknown> extends AxiosResponse {
	code: number;
	data: T;
	msg: string;
	success: boolean;
}
/*
 * 详情请求参数
 */
export interface IBaseDetialReqData {
	/*
	 * 主键ID
	 */
	id: string;
}

/*
 * 删除请求参数
 */
export interface IBaseDelReqData {
	/*
	 * 主键ID 多个,隔开
	 */
	ids: string;
}

/**
 * 列表-返回对象
 */
export interface IBaseListResData<T = unknown> {
	/*
	 * 列表数据
	 */
	list: T;
	/*
	 * 分页信息
	 */
	pagination: SystemPagination & { total: number };
}

export interface SystemPagination {
	currentPage: number;
	pageSize: number;
	total?: number;
}
