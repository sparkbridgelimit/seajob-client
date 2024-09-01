import router from "@/router";
import {
  Form,
  Input,
  Slider,
  Button,
  SliderSingleProps,
  Space,
  Select,
  message,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSnapshot } from "valtio";
import state, { loadJobDefineDetail, saveJobDefineDetail } from "./state";
import "./index.css";
import cityList from "@/data/city";

const { Option } = Select;

export default function PlanDetail() {
  // 动态路由参数id
  const { id } = useParams<{ id: string }>();
  const snap = useSnapshot(state);
  const [isModified, setIsModified] = useState(false);

  const [form] = Form.useForm();

  // 加载 job define detail
  useEffect(() => {
    loadJobDefineDetail(id!);
  }, []);

  useEffect(() => {
    form.setFieldsValue({
      job_define_name: snap.job_define_name,
      hello_text: snap.hello_text,
      keyword: snap.keyword,
      city_code: snap.city_code,
      salary_range: snap.salary_range,
      key_kills: snap.key_kills,
      exclude_company: snap.exclude_company,
      exclude_job: snap.exclude_job,
      wt2_cookie: snap.wt2_cookie,
    });
  }, [snap, form]);

  // 监听表单变化
  const handleFormChange = () => {
    setIsModified(true);
  };

  const marks: SliderSingleProps["marks"] = {
    0: "0k",
    100: "100k",
  };

  const onFinish = async (values: any) => {
    console.log("Received values:", values);
    values.salary_range = values.salary_range.map((item: any) => Number(item));
    await saveJobDefineDetail({
      id: snap.job_define_id,
      ...values,
    });
    setIsModified(false);
    message.success("保存成功");
  };

  return (
    <div className="plan-detail">
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        onValuesChange={handleFormChange}
      >
        <Form.Item
          name="job_define_name"
          label="投递计划名称"
          rules={[{ required: true, message: "请输入投递计划说明" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="hello_text" label="打招呼文案">
          <TextArea rows={2} />
        </Form.Item>
        <Form.Item
          name="keyword"
          label="岗位关键字"
          rules={[{ required: true, message: "请输入岗位关键字" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="city_code"
          label="城市"
          rules={[{ required: true, message: "请输入城市代码" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            style={{ width: "100%" }}
            placeholder="请选择您的城市"
            options={cityList}
          />
        </Form.Item>
        <Form.Item
          name="salary_range"
          label="薪资范围(k)"
          rules={[{ required: true, message: "Please enter salary range" }]}
        >
          <Slider
            marks={marks}
            tooltip={{ autoAdjustOverflow: true, formatter: (v) => v + "k" }}
            range
            min={0}
            max={100}
          />
        </Form.Item>
        <Form.Item name="key_kills" label="岗位关键技能">
          <Select
            mode="tags"
            style={{ width: "100%" }}
            placeholder="按回车确定"
            onChange={(value) => {
              setIsModified(true);
              form.setFieldsValue({ key_kills: value.map(String) });
            }}
          >
            {snap.key_kills.map((item: string, index: number) => (
              <Option key={`${item}-${index}`} value={String(item)}>
                {item}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="exclude_company" label="排除以下公司">
          <Select
            mode="tags"
            style={{ width: "100%" }}
            placeholder="按回车确定"
            onChange={(value) => {
              setIsModified(true);
              form.setFieldsValue({ exclude_company: value.map(String) });
            }}
          >
            {snap.exclude_company.map((item: string, index: number) => (
              <Option key={`${item}-${index}`} value={String(item)}>
                {item}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="exclude_job" label="排除的岗位">
          <Select
            mode="tags"
            style={{ width: "100%" }}
            placeholder="按回车确定"
            onChange={(value) => {
              setIsModified(true);
              form.setFieldsValue({ exclude_job: value.map(String) });
            }}
          >
            {snap.exclude_job.map((item: string, index: number) => (
              <Option key={`${item}-${index}`} value={String(item)}>
                {item}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="wt2_cookie" label="Cookie">
          <Input />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
          <Space>
            <Button type="default" onClick={() => console.log("运行")}>
              运行
            </Button>
            <Button type="default" htmlType="submit" disabled={!isModified}>
              保存
            </Button>
            <Button htmlType="button" onClick={() => router.navigate("/plan")}>
              返回
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
}
