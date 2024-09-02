import { proxy } from 'valtio';
import { signIn, signOut } from "@/api/auth";
import router from '@/router';
import { clear_token, set_token } from '@/helper';

const state = proxy({
  token: window.localStorage.getItem('token'),
  isLogin: !!window.localStorage.getItem('token'),
});

export const actions = {
  async signout() {
    try {
      await signOut();
    } catch (error) {
      console.error("登出失败:", error);
    } finally {
      clear_token();
      router.navigate("/signin");
    }
  },
  async signin(username: string, password: string) {
    try {
      const data = await signIn({
        username,
        password,
      });
      set_token(data.token);
      // 跳转到首页
      router.navigate("/plan");
    } catch (error) {
      console.error("登陆失败:", error);
    } finally {
    }
  },
  async signup(username: string, password: string) {
    try {
      const data = await signIn({
        username,
        password,
      });
      set_token(data.token);
      // 跳转到首页
      router.navigate("/plan");
    } catch (error) {
      console.error("登陆失败:", error);
    } finally {
    }
  },
}

export default state;
