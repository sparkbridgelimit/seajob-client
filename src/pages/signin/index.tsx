import { signIn } from "@/api/auth";
import router from "@/router";
import { Form, Input, message, Space } from "antd";
import { useState } from "react";
import { Store } from "tauri-plugin-store-api";
import { isTauri, set_token } from "@/helper";
import { Link } from "react-router-dom";

const store = new Store(".settings.json");

export default function SignIn() {
  const [form] = Form.useForm();
  const [_, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const data = await signIn({
        username: values.username,
        password: values.password,
      });
      set_token(data.token);
      message.success("登陆成功，正在跳转...");
      // 跳转到首页
      router.navigate("/plan");
    } catch (error) {
      message.error("登陆失败，请重试");
      console.error("登陆失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto" }}>
      <Form
        form={form}
        name="signin"
        onFinish={onFinish}
        initialValues={{}}
        scrollToFirstError
      >
        <Form.Item
          name="username"
          label="用户名"
          rules={[{ required: true, message: "请输入用户名!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: "请输入密码!" }]}
          hasFeedback
        >
          <Input.Password />
        </Form.Item>
        <Space>
          <button type="submit">登陆</button>
          <Link to="/signup">注册新账号</Link>
        </Space>
      </Form>
    </div>
  );
}
