import { signUp } from "@/api/auth";
import { isTauri } from "@/helper";
import router from "@/router";
import { Form, Input, Button, message } from "antd";
import { useState } from "react";
import { Store } from "tauri-plugin-store-api";

const store = new Store(".settings.json");

const SignUp = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const data = await signUp({
        username: values.username,
        password: values.password,
      });
      localStorage.setItem("token", data.token);
      if (isTauri()) {
        console.log("isTauri");
        await store.set("token", data.token);
        await store.save();
      }
      // 存到tauri
      message.success("注册成功");
      // 跳转到首页
      router.navigate("/plan");
    } catch (error) {
      message.error("注册失败，请重试");
      console.error("注册失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (_: any, value: any) => {
    if (value && form.getFieldValue("password") !== value) {
      return Promise.reject(new Error("两次输入的密码不匹配!"));
    }
    return Promise.resolve();
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto" }}>
      <h2>注册</h2>
      <Form
        form={form}
        name="signup"
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
          rules={[
            { required: true, message: "请输入密码!" },
            { min: 6, message: "密码至少6个字符!" },
          ]}
          hasFeedback
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name="confirm"
          label="确认密码"
          dependencies={["password"]}
          hasFeedback
          rules={[
            { required: true, message: "请确认密码!" },
            { validator: validatePassword },
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ width: "100%" }}
          >
            注册
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SignUp;
