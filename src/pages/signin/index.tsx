import { message } from "antd";
import "./index.css";
import router from "@/router";
import { useState } from "react";
import { Button } from "@nextui-org/button";
import Header from "@/components/header";
import { actions } from "@/store/auth";

export default function SignIn() {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const onFinish = async () => {
    if (!username || !password) {
      message.error("请输入账号和密码");
      return;
    }
    try {
      await actions.signIn(
        username,
        password,
      );
      console.log('登陆成功')
      message.success("登陆成功");
      // 跳转到首页
      console.log('跳转到首页')
      router.navigate("/plan");
    } catch (error) {
      message.error("登陆失败，请重试");
      console.error("登陆失败:", error);
    } finally {
    }
  };

  return (
    <div className="background">
      <div className="min-h-screen flex flex-col justify-between">
        <Header></Header>
        <div className="flex-grow flex items-center justify-center">
          <div className="login bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-4">
            <h1 className="text-2xl font-bold text-gray-900 text-center">
              欢迎登陆《海投助手》
            </h1>
            <div className="flex items-center justify-between">
              <span className="block w-full h-px bg-gray-300"></span>
              <span className="mx-2 text-sm font-medium text-gray-500">OR</span>
              <span className="block w-full h-px bg-gray-300"></span>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700 block mb-1"
                >
                  账号
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <i className="far fa-envelope"></i>
                  </span>
                  <input
                    id="username"
                    onChange={(e) => setUserName(e.target.value)}
                    type="text"
                    placeholder="请输入您的账号"
                    className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700 block mb-1"
                >
                  密码
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <i className="fas fa-lock"></i>
                  </span>
                  <input
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    id="password"
                    placeholder="请输入您的密码"
                    className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-900"
                  />
                </div>
              </div>
            </div>
            <Button color="primary" fullWidth onClick={() => onFinish()}>
              登陆
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
