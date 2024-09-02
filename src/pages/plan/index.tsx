import { useCallback, useEffect, useState } from "react";
import { Button, Popconfirm, Space } from "antd";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import {
  deleteJobDefine,
  createJobDefine,
  getJobDefineList,
} from "@/api/job_define";
import AddJobDefineModal from "./add-job-model";
import Scan from "../scan";
import "./index.css";
import Header from "@/components/header";
import {
  Chip,
  Button as NextButton,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import router from "@/router";
import { DeleteIcon } from "@/icons/delete";

interface JobDefine {
  id: number;
  job_define_name: string;
  job_define_desc: string;
  status: string;
  create_time: string;
}

type JobDefineList = JobDefine[];

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
  const columns = [
    {
      key: "job_define_name",
      label: "计划名称",
    },
    {
      key: "job_define_desc",
      label: "计划描述",
    },
    {
      key: "status",
      label: "状态",
    },
    {
      key: "total_hi",
      label: "总沟通数",
    },
    {
      key: "last_run_time",
      label: "最近运行时间",
    },
    {
      key: "create_time",
      label: "创建时间",
    },
    {
      key: "action",
      label: "操作",
    },
  ];

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
  };

  const addJobDefineHandler = async () => {
    setIsAddModalOpen(true);
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
  };

  // 渲染单元格内容
  const renderCell = useCallback((item: any, columnKey: any) => {
    switch (columnKey) {
      case "status":
        return (
          <Chip className="capitalize" color="warning" size="sm" variant="flat">
            未开始
          </Chip>
        );
      case "action":
        return (
          <div>
            <Space>
              <NextButton
                color="primary"
                size="sm"
                onClick={() => runJob(item.id)}
              >
                运行
              </NextButton>
              <NextButton
                color="primary"
                size="sm"
                variant="ghost"
                onClick={() => router.navigate(`/plan/${item.id}`)}
              >
                详情
              </NextButton>

              <Popconfirm
                title="删除投递计划"
                description="删除后不可恢复，确定删除吗？"
                onConfirm={() => deleteJobDefineHandler(item.id)}
                onCancel={() => {}}
                okText="确认"
                cancelText="取消"
              >
                <NextButton
                  color="danger"
                  size="sm"
                  variant="ghost"
                >
                  删除
                </NextButton>
              </Popconfirm>
            </Space>
          </div>
        );
      default:
        return item[columnKey];
    }
  }, []);

  return (
    <div className="plan">
      <Header />
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "16px",
          }}
        >
          <Space>
            <NextButton color="primary" onClick={() => addJobDefineHandler()}>
              添加投递计划
            </NextButton>
          </Space>
        </div>
        <Table color="primary" selectionMode="single">
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.key}>{column.label}</TableColumn>
            )}
          </TableHeader>
          <TableBody items={data} emptyContent={"暂无投递计划, 请添加"}>
            {(item) => (
              <TableRow key={item.key}>
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Scan
        open={isModalOpen}
        qrCode={qrCode}
        onClose={() => setIsModalOpen(false)}
      ></Scan>
      <AddJobDefineModal
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={(values) => onAddJobDefineConfirm(values)}
        open={isAddModalOpen}
      ></AddJobDefineModal>
    </div>
  );
}

export default Plan;
