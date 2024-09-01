import { useEffect, useMemo, useState } from "react";
import { Button, Table, Space, Popconfirm, message } from "antd";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import {
  deleteJobDefine,
  createJobDefine,
  getJobDefineList,
} from "@/api/job_define";
import AddJobDefineModal from "./add-job-model";
import router from "@/router";
import { signOut } from "@/api/auth";
import { clear_token } from "@/helper";
import Scan from "../scan";
import "./index.css";

function Plan() {
  const [data, setData] = useState([]);
  const [qrCode, setQrCode] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    getJobDefineList()
      .then((res) => {
        console.log(res);
        setData(res);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  useEffect(() => {
    const l1 = listen("login-first-randkey", (event) => {
      console.log(event.payload);
      setQrCode(event.payload as string);
      setIsModalOpen(true);
    });

    const l2 = listen("login-second-key", (event) => {
      console.log(event.payload);
      setQrCode(event.payload as string);
      setIsModalOpen(true);
    });

    const l3 = listen("scan-success", (event) => {
      console.log(event.payload);
      setIsModalOpen(false);
      setQrCode("");
    });

    const l4 = listen("scan-failed", (event) => {
      console.log(event.payload);
      setIsModalOpen(false);
      setQrCode("");
    });

    return () => {
      l1.then((unlisten) => unlisten());
      l2.then((unlisten) => unlisten());
      l3.then((unlisten) => unlisten());
      l4.then((unlisten) => unlisten());
    };
  }, []);

  const columns = useMemo(() => {
    return [
      {
        title: "名称",
        dataIndex: "job_define_name",
        key: "job_define_name",
        width: 200,
      },
      {
        title: "描述",
        dataIndex: "job_define_desc",
        key: "job_define_desc",
        width: 200,
      },
      {
        title: "打招呼数",
        dataIndex: "",
        key: "",
        render: () => 0,
      },
      {
        title: "状态",
        dataIndex: "",
        key: "",
        render: () => "未开始",
      },
      {
        title: "创建时间",
        dataIndex: "create_time",
        key: "create_time",
        width: 200,
      },
      {
        title: "操作",
        key: "action",
        width: 200,
        render: (_: any, record: { id: any }) => {
          return (
            <>
              <Space>
                <Button onClick={() => runJob(record.id)}>运行</Button>
                <Button onClick={() => router.navigate(`/plan/${record.id}`)}>
                  详情
                </Button>
                <Popconfirm
                  title="删除投递计划"
                  description="删除后不可恢复，确定删除吗？"
                  onConfirm={() => deleteJobDefineHandler(record.id)}
                  onCancel={() => {}}
                  okText="确认"
                  cancelText="取消"
                >
                  <Button>删除</Button>
                </Popconfirm>
              </Space>
            </>
          );
        },
      },
    ];
  }, []);

  const runJob = async (id: number) => {
    // 处理查看操作，例如跳转到详情页或显示模态框
    console.log("查看记录的ID:", id);
    await invoke("run_job_define", { id });
  };

  const deleteJobDefineHandler = async (id: number) => {
    console.log("删除记录的ID:", id);
    await deleteJobDefine(id);
    await getJobDefineList()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error(err);
      });
    message.success("删除成功");
  };

  const addJobDefineHandler = async () => {
    setIsAddModalOpen(true);
  };

  const signoutHandler = async () => {
    const res = await signOut();
    console.log(res);
    clear_token();
    router.navigate("/signin");
  };

  const onAddJobDefineConfirm = async (values: any) => {
    console.log("添加投递计划", values);
    const key_kills = values.key_kills?.split(",") || [];
    const exclude_company = values.exclude_company?.split(",") || [];
    const exclude_job = values.exclude_job?.split(",") || [];
    await createJobDefine({
      ...values,
      key_kills,
      exclude_company,
      exclude_job,
    });
    await getJobDefineList()
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        console.error(err);
      });
    setIsAddModalOpen(false);
    message.success("添加成功");
  };

  return (
    <div className="container plan">
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "16px",
        }}
      >
        <Space>
          <Button type="default" onClick={() => addJobDefineHandler()}>
            添加
          </Button>
          <Button type="default" onClick={() => signoutHandler()}>
            登出
          </Button>
        </Space>
      </div>
      <Table dataSource={data} rowKey="id" columns={columns} />
      <Scan open={isModalOpen} qrCode={qrCode} onClose={() => setIsModalOpen(false)}></Scan>
      <AddJobDefineModal
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={(values) => onAddJobDefineConfirm(values)}
        open={isAddModalOpen}
      ></AddJobDefineModal>
    </div>
  );
}

export default Plan;
