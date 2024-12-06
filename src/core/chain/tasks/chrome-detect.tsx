import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api";
import { Button } from "@/components/ui/button";
import { ScrollShadow } from "@nextui-org/react";
import { TaskComponent } from "../types";
import { useQuery } from "react-query";
import { MyContext } from "../biz";

const ChromeDetectTask: TaskComponent<MyContext> = ({
  onResolve,
  onReject,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isInstall, setIsInstall] = useState<boolean>(false);

  // 监听安装日志
  useEffect(() => {
    const unlistenPromise = listen("install_log", (event) => {
      setLogs((prevLogs) => [...prevLogs, event.payload as string]);
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  // 日志滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // 使用useQuery立即检测Chrome安装情况
  const { isLoading } = useQuery(
    "detectChrome",
    () => invoke("detect_chrome"),
    {
      retry: false,
      onSuccess: (res) => {
        if (typeof res === "string" && res.trim() !== "") {
          // 已安装Chrome，直接进入下一步，不显示对话框
          onResolve();
        } else {
          // 未安装Chrome，显示对话框
          setIsOpen(true);
        }
      },
      onError: (err) => {
        console.error("检测Chrome出错：", err);
        // onReject("检测失败");
        setIsOpen(true);
      },
    }
  );

  if (isLoading) {
    // 检测中，不显示对话框和UI，避免已安装时闪现对话框
    return null;
  }

  // 此时如果代码执行到这里，说明检测结果为未安装Chrome（data为空或非字符串）
  // 显示对话框让用户安装

  // 对话框关闭时reject
  const handleDialogClose = () => {
    setIsOpen(false);
    onReject("用户主动取消");
  };

  // 安装Chrome逻辑
  const handleInstall = async () => {
    try {
      setIsInstall(true);
      await invoke("install_chrome", {});
      setIsInstall(false);
      // 安装完成后继续流程
      onResolve();
      setIsOpen(false);
    } catch (e) {
      console.error(e);
      onReject("安装Chrome失败");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>执行环境检测</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-gray-500 flex items-center mb-2">
          找不到可执行的Chrome，请点击「立即安装」按钮进行安装
          <Button
            className="ml-2"
            color="primary"
            size="sm"
            disabled={isInstall}
            onClick={handleInstall}
          >
            立即安装
          </Button>
        </div>
        <ScrollShadow
          className="rounded-medium p-4 mb-4 h-[200px]"
          style={{ backgroundColor: "#363449", color: "#f4f4f4" }}
          isEnabled={false}
          size={0}
          ref={scrollRef}
        >
          {logs.map((log, index) => (
            <p key={index}>{log}</p>
          ))}
        </ScrollShadow>
      </DialogContent>
    </Dialog>
  );
};

export default ChromeDetectTask;