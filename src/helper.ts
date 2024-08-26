import { invoke } from "@tauri-apps/api";

export const isTauri = () => {
  return typeof window !== 'undefined' && !!window.__TAURI__;
};

export async function get_token () {
  if (isTauri()) {
    return await invoke("get_token", {});
  } else {
    return window.localStorage.getItem('token') || '';
  }
}

export const set_token = async (token: string) => {
  if (isTauri()) {
    await invoke("set_token", { token });
  } else {
    window.localStorage.setItem('token', token);
  }
}

export const clear_token = async () => {
  if (isTauri()) {
    await invoke("clear_token", {});
  } else {
    window.localStorage.removeItem('token');
  }
}