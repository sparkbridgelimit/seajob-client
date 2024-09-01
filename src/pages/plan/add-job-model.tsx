import React from "react";
import { Modal, Form, Input, Slider, Button, SliderSingleProps, Select } from "antd";
import TextArea from "antd/es/input/TextArea";
import cityList from "@/data/city";

interface AddJobDefineModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (values: any) => void;
}

const AddJobDefineModal: React.FC<AddJobDefineModalProps> = ({
  open = false,
  onClose = () => {},
  onConfirm = () => {},
}) => {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log("Received values:", values);
    values.salary_range = values.salary_range.map((item: any) => Number(item));
    onConfirm(values);
    form.resetFields();
  };

  const marks: SliderSingleProps["marks"] = {
    0: "0k",
    100: "100k",
  };

  return (
    <Modal
      title="添加岗位投递计划"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={() => form.submit()}>
          确定
        </Button>,
      ]}
    >
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        initialValues={{
          hello_text: "你好",
          salary_range: [10, 20],
          city_code: "101280600",
        }}
      >
        <Form.Item
          name="job_define_name"
          label="投递计划名称"
          rules={[{ required: true, message: "请输入投递计划名称" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="job_define_desc"
          label="投递计划说明"
          rules={[{ required: false, message: "请输入投递计划说明" }]}
        >
          <TextArea />
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
          label="城市代码"
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
      </Form>
    </Modal>
  );
};

export default AddJobDefineModal;
