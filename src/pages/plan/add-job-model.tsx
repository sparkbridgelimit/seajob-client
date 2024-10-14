import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  Slider,
  Button,
  SliderSingleProps,
  Select,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import cityList from "@/data/city";
import { Switch } from "@nextui-org/react";

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
  const [salaryRange, setSalaryRange] = useState([10, 30]);
  const [ isFilterOfflineBoss, setIsFilterOfflineBoss ] = useState<boolean>(false);

  const onFinish = (values: any) => {
    console.log("Received values:", values);
    values.salary_range = values.salary_range.map((item: any) => Number(item));
    onConfirm(values);
    form.resetFields();
  };

  const onSalaryChange = (value: any) => {
    setSalaryRange(value); // 更新薪资范围
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
          keyword: "",
          salary_range: [10, 30],
          city_code: "101280600",
        }}
      >
        <Form.Item
          name="job_define_name"
          label="投递计划名称"
          rules={[{ required: true, message: "请输入投递计划名称" }]}
        >
          <Input placeholder="投递计划名称" />
        </Form.Item>
        <Form.Item
          name="job_define_desc"
          label="投递计划说明"
          rules={[{ required: false, message: "请输入投递计划说明" }]}
        >
          <TextArea placeholder="说点什么好吧, 给你自己记录的, 不写也行" />
        </Form.Item>
        <Form.Item
          name="keyword"
          label="岗位关键字(用于搜索岗位)"
          rules={[{ required: false, message: "请输入岗位关键字" }]}
        >
          <Input placeholder="开发、运营、产品经理、销售..." />
        </Form.Item>
        <Form.Item
          name="hello_text"
          label="打招呼文案"
          rules={[{ required: true, message: "请输入你和Boss的开场白" }]}
        >
          <TextArea placeholder="你好, 我觉得我胜任这个职位, 可以详聊一下吗?" rows={2} />
        </Form.Item>
        <Form.Item
          name="city_code"
          label="选择期望的城市"
          rules={[{ required: true, message: "选择期望的城市" }]}
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
          label={`薪资范围: (${salaryRange[0]}-${salaryRange[1]}K)`}
          rules={[{ required: true, message: "请选择" }]}
        >
          <Slider
            marks={marks}
            tooltip={{ autoAdjustOverflow: true, formatter: (v) => v + "k" }}
            range
            min={0}
            max={100}
            value={salaryRange}
            onChange={onSalaryChange}  // 当值变化时更新状态
          />
        </Form.Item>
        <Form.Item
          name="filter_offline"
          label="过滤不在线boss"
        >
          <Switch isSelected={isFilterOfflineBoss} onValueChange={setIsFilterOfflineBoss} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddJobDefineModal;
