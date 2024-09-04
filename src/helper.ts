import { invoke } from "@tauri-apps/api";

export const isTauri = () => {
  return typeof window !== 'undefined' && !!window.__TAURI__;
};

export async function get_token() {
  return Promise.resolve(window.localStorage.getItem('token'));
}

export const set_token = async (token: string) => {
  if (isTauri()) {
    await invoke("set_token", { token });
  }
  window.localStorage.setItem('token', token);
  return Promise.resolve(true);
}

export const clear_token = async () => {
  if (isTauri()) {
    try {
      await invoke("clear_token", {});
    } catch (error) {
      console.error(error);
    }
  }
  window.localStorage.removeItem('token');
  return Promise.resolve();
}