import { invoke } from "@tauri-apps/api";

export const isTauri = () => {
  return typeof window !== 'undefined' && !!window.__TAURI__;
};

export async function get_token() {
  if (isTauri()) {
    try {
      return await invoke("get_token", {});
    } catch (error) {
      console.error(error);
    } finally {
      return Promise.resolve();
    }
  }
  return Promise.resolve(window.localStorage.getItem('token'));
}

export const set_token = async (token: string) => {
  if (isTauri()) {
    await invoke("set_token", { token });
  }
  window.localStorage.setItem('token', token);
  return Promise.resolve();
}

export const clear_token = async () => {
  if (isTauri()) {
    await invoke("clear_token", {});
  }
  window.localStorage.removeItem('token');
  return Promise.resolve();
}