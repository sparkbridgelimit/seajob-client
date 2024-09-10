import { useEffect, useState } from "react";
import { message, Space } from "antd";
import { listen } from "@tauri-apps/api/event";
import { createJobDefine } from "@/api/job_define";
import AddJobDefineModal from "./add-job-model";
import Scan from "../scan";
import "./index.css";
import Header from "@/components/header";
import { Button as NextButton } from "@nextui-org/react";
import { runTask, stopTask } from "@/store/task";
import PlanTable from "./plan-table";
import { fetchJobDefines } from "@/store/job_define";
import DetectButton from "./detect-button";
import { log_task } from "@/api/job_define";
import { parseLog } from "@/helper";

function Plan() {
  const [qrCode, setQrCode] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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

    // 启动后将禁用所有的投递计划启动按钮, 防止重复启动, 已启动的任务, 启动按钮变成运行中
    const l5 = listen("job_starting", (event) => {
      console.log("job_starting", Number(event.payload));
      runTask(Number(event.payload));
      message.success("任务启动成功");
    });

    const l6 = listen("job_finish", (event) => {
      console.log(event.payload);
      stopTask();
      message.success("任务运行完成");
    });

    const l7 = listen("job_error", (event) => {
      console.log(event.payload);
      stopTask();
      message.success("任务运行失败, 请检查日志");
    });

    const l8 = listen("greet_done", (event) => {
      console.log('greet_done: ', event.payload);
      try {
        const data = parseLog(event.payload as string);
        log_task(data);
      } catch (error) { 
        console.error(error);
      }
    });

    return () => {
      l1.then((unlisten) => unlisten());
      l2.then((unlisten) => unlisten());
      l3.then((unlisten) => unlisten());
      l4.then((unlisten) => unlisten());
      l5.then((unlisten) => unlisten());
      l6.then((unlisten) => unlisten());
      l7.then((unlisten) => unlisten());
      l8.then((unlisten) => unlisten());
    };
  }, []);

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
    fetchJobDefines();
    setIsAddModalOpen(false);
  };

  return (
    <div className="plan">
      <Header />
      <div className="p-8">
        <div
          className="mb-4"
          style={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Space>
            <DetectButton />
            <NextButton color="primary" variant="shadow" onClick={() => addJobDefineHandler()}>
              添加投递计划
            </NextButton>
          </Space>
        </div>
        <PlanTable />
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
