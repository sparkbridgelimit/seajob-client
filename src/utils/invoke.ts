import { isTauri } from "@/helper";
import { invoke as iv } from "@tauri-apps/api";

export const invoke = async (key: string, payload = {}) => {
  console.log(`before invoke: ${key}`, payload)
  if (isTauri()) {
    try {
      const res = await iv(key, payload);
      console.log(`after invoke: ${key}`, res)
      return res;
    } catch (error) {
      console.error(`invoke key ${key} fail:`, error);
    }
  }
}
