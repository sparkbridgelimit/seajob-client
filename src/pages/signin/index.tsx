import { message, Space } from "antd";
import "./index.css";
import { signIn } from "@/api/auth";
import { set_token } from "@/helper";
import router from "@/router";
import { useState } from "react";
import { Button } from "@nextui-org/button";

export default function SignIn() {
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const onFinish = async () => {
    if (!username || !password) {
      message.error("请输入账号和密码");
      return;
    }
    try {
      const data = await signIn({
        username,
        password,
      });
      set_token(data.token);
      message.success("登陆成功，正在跳转...");
      // 跳转到首页
      router.navigate("/plan");
    } catch (error) {
      message.error("登陆失败，请重试");
      console.error("登陆失败:", error);
    } finally {
    }
  };

  return (
    <div className="bg-gray-50 background-gradient">
      <div className="min-h-screen flex flex-col justify-between">
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center space-x-2">
            <img
              src="https://placehold.co/24x24"
              alt="海投助手"
              className="w-6 h-6"
            />
            <span className="text-xl font-bold text-gray-900">海投助手</span>
          </div>
          <div>
            <Space>
              <a
                href="#"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                没有账号?
              </a>
              <Button color="primary" onClick={() => router.navigate('/signup')}>注册</Button>
            </Space>
          </div>
        </div>
        <div className="flex-grow flex items-center justify-center">
          <div className="login bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-4">
            <h1 className="text-2xl font-bold text-gray-900 text-center">
              欢迎回来
            </h1>

            {/* <button className="w-full flex items-center justify-center border border-gray-300 rounded-lg p-3 text-gray-700 font-medium hover:bg-gray-50">
              <img
                src="https://placehold.co/20x20"
                alt="Google logo"
                className="w-5 h-5 mr-2"
              />
              Continue with Google
            </button> */}

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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-900"
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-gray-900"
                  />
                  {/* <a
                    href="#"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm font-medium text-purple-600 hover:underline"
                  >
                    忘记密码?
                  </a> */}
                </div>
              </div>
            </div>
            <Button color="primary" fullWidth onClick={() => onFinish()}>
              登陆
            </Button>
          </div>
        </div>

        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            没有账号?
            <a href="#" className="text-purple-600 font-medium hover:underline">
              注册
            </a>
          </p>
        </div>

        <div className="p-6 text-center text-xs text-white">
          <p>
            This site is protected by reCAPTCHA and the Google
            <a href="#" className="underline">
              Privacy Policy
            </a>
            and
            <a href="#" className="underline">
              Terms of Service
            </a>
            apply.
          </p>
        </div>
      </div>
      {/* <div className="background-bg"></div> */}
    </div>
  );
}
