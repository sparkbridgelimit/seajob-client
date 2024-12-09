import { useEffect, useState } from "react";
import { message, Space } from "antd";
import { listen } from "@tauri-apps/api/event";
import { createJobDefine } from "@/api/job_define";
import AddJobDefineModal from "./add-job-model";
import "./index.css";
import Header from "@/components/header";
import { runTask, stopTask } from "@/store/task";
import PlanTable from "./plan-table";
import { fetchJobDefines } from "@/store/job_define";
import { log_task } from "@/api/job_define";
import { parseLog } from "@/helper";
import { Button } from "@/components/ui/button";
import LogModal from "./log-modal";
import ChromeModal from "./chrome-modal";
import { clearRunLog } from "@/store/plan";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import {
  ChallengePayload,
  isChallengePayload,
  isJobFinishedPayload,
  JobFinishedPayload,
  StdIOMsg,
  StdIOMsgWithPayload,
} from "@/types/msg";
import { invoke } from "@/utils/invoke";

function Plan() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    // 启动后将禁用所有的投递计划启动按钮, 防止重复启动, 已启动的任务, 启动按钮变成运行中
    const l5 = listen("job_started", (event) => {
      console.log("job_started", Number(event.payload));
      clearRunLog();
      runTask(Number(event.payload));
      message.success("任务启动成功");
    });

    const l6 = listen("job_finished", (event) => {
      console.log(event.payload);
      stopTask();
      fetchJobDefines();
      message.success("任务运行完成");
    });

    const l7 = listen("job_error", (event) => {
      console.log(event.payload);
      stopTask();
      fetchJobDefines();
      message.success("任务运行失败, 请检查日志");
    });

    const l8 = listen("greet_done", async (event) => {
      console.log("greet_done: ", event.payload);
      try {
        const data = parseLog(event.payload as string);
        await log_task(data);
      } catch (error) {
        console.error(error);
      }
    });

    const l9 = listen(
      "json_result",
      async (event: { payload: StdIOMsgWithPayload }) => {
        console.log("json_result: ", event.payload);
        const msg = event.payload;
        // 遇到风控
        if (isChallengePayload(msg)) {
          toast({
            variant: "destructive",
            title: "触发风控",
            description: "识别到触发风控, 需要手动进行验证码处理",
            action: (
              <ToastAction
                altText="Try again"
                onClick={async () => {
                  // 处理点击事件
                  console.log(msg.payload.url);
                  await invoke("launch_browser", {
                    id: String(msg.payload.job_define_id),
                    task: "open_browser",
                    payload: {
                      url: msg.payload.url,
                    },
                    headless: false,
                    autoClose: false,
                  });
                }}
              >
                点击处理验证码
              </ToastAction>
            ),
          });
        }
        // 运行完成
        if (isJobFinishedPayload(msg)) {
          stopTask();
          fetchJobDefines();
          toast({
            description: "任务运行完成",
          });
        }
        console.warn("Unknown message type:", msg.type);
      }
    );

    return () => {
      l5.then((unlisten) => unlisten());
      l6.then((unlisten) => unlisten());
      l7.then((unlisten) => unlisten());
      l8.then((unlisten) => unlisten());
      l9.then((unlisten) => unlisten());
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
            <Button color="primary" onClick={() => window.location.reload()}>
              刷新数据
            </Button>
            <Button color="primary" onClick={() => addJobDefineHandler()}>
              添加投递计划
            </Button>
          </Space>
        </div>
        <PlanTable />
      </div>
      <AddJobDefineModal
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={(values) => onAddJobDefineConfirm(values)}
        open={isAddModalOpen}
      ></AddJobDefineModal>
      <LogModal />
      <ChromeModal />
    </div>
  );
}

export default Plan;
