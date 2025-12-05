export interface UserInfo {
	id: string;
	name: string;
	avatar: string;
	phone: string;
	email: string;
	status: string;
}
export interface UserState {
	token: string;
	userInfo: UserInfo;
	isLogin: boolean;
}
