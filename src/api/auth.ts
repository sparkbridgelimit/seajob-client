import { request } from "./request";

export interface ISignInReq {
  username: string;
  password: string;
}

export async function signIn(data: ISignInReq): Promise<any> {
  return await request({
    path: '/api/f/sign_in',
    data,
    app: 'auth',
    env: 'PROD',
  });
}

export interface ISignUpReq {
  username: string;
  password: string;
}

export interface ISignUpRes {
  token: string;
  exp_at: number;
}

export async function signUp(data: ISignUpReq): Promise<ISignUpRes> {
  return await request({
    app: 'auth',
    env: 'PROD',
    path: '/api/f/sign_up',
    data
  });
}

export async function signOut() {
  return await request({
    app: 'auth',
    env: 'PROD',
    path: '/api/s/sign_out',
    data: {}
  });
}

export interface IQueryMemberInfoRes {
  biz_code: string;
  expires_at: string;
  create_time: string
}

export async function queryMemberInfo(): Promise<IQueryMemberInfoRes> {
  return await request({
    path: '/api/s/member/info',
    data: {},
    app: 'auth',
    env: 'PROD'
  });
}

export async function checkMemberValid(): Promise<boolean> {
  return await request({
    path: '/api/s/member/check',
    data: {},
    app: 'auth',
    env: 'PROD'
  });
}

export interface IActivateCodeConsumeReq {
  code: string;
}

export async function activateCodeConsume({ code }: IActivateCodeConsumeReq): Promise<boolean> {
  return await request({
    path: '/api/s/activate/consume',
    data: {
      code
    },
    app: 'auth',
    env: 'PROD'
  });
}