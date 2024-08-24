import { request } from "./request";

export interface ISignInReq {
  username: string;
  password: string;
}

export async function signIn(data: ISignInReq) {
  return request({
    path: '/api/f/sign_in',
    data,
    app: 'auth',
    env: 'PROD'
  })
    .then(res => res.data || {});
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
  return request({
    app: 'auth',
    env: 'PROD',
    path: '/api/f/sign_up',
    data
  })
  .then(res => res.data || {});
}

export async function signOut() {
  return request({
    app: 'auth',
    env: 'PROD',
    path: '/api/s/sign_out',
    data: {}
  })
    .then(res => res.data || {});
}