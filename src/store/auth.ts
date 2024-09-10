import { proxy } from 'valtio';
import { activateCodeConsume, checkMemberValid, IQueryMemberInfoRes, queryMemberInfo, signIn, signOut } from "@/api/auth";
import router from '@/router';
import { clear_token, set_token } from '@/helper';
import dayjs from 'dayjs';  // 用于处理日期格式

const state = proxy({
  token: window.localStorage.getItem('token'),
  isLogin: !!window.localStorage.getItem('token'),
  memberInfo: null as IQueryMemberInfoRes | null,
  // 根据memberInfo生成会员标签
  get memberLabel(): string {
    if (!this.memberInfo) {
      console.log('您还未激活会员')
      return '您还未激活会员';  // 没有会员信息，表示未激活
    }
    const now = dayjs();  // 当前时间
    const expiresAt = dayjs(this.memberInfo.expires_at);  // 会员过期时间

    if (expiresAt.isBefore(now)) {
      return '您的会员已过期';  // 会员已过期，给出续费提示
    } else {
      return `您的会员有效，会员将于 ${expiresAt.format('YYYY-MM-DD HH:mm')} 失效`;  // 会员有效，显示失效时间
    }
  },
  get memberLabelColor() {
    if (!this.memberInfo) {
      return 'default';
    }

    const now = dayjs();
    const expiresAt = dayjs(this.memberInfo.expires_at);

    if (expiresAt.isBefore(now)) {
      return 'warning';
    }

    return 'primary';
  }
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
  async checkMemberValid() {
    try {
      return await checkMemberValid();
    } catch (error) {
      console.error("查询会员状态失败:", error);
      return Promise.resolve(false);
    }
  },
  async queryMemberInfo() {
    try {
      const data = await queryMemberInfo();
      state.memberInfo = data;
    } catch (error) {
      console.error("查询会员信息失败:", error);
      return Promise.resolve(null);
    }
  },
  async activateCodeConsume (code: string) {
    try {
      return await activateCodeConsume({code});
    } catch (error) {
      console.error("激活失败:", error);
      return Promise.resolve(null);
    }
  },
}

export default state;

