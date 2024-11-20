import { Button } from "@/components/ui/button";
import planState, { hideChromeModal, setChromePath } from "@/store/plan";
import {
  ModalContent,
  ModalHeader,
  ModalBody,
  Modal,
  ScrollShadow,
  Textarea,
} from "@nextui-org/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";

export default function ChromeModal({}) {
  const { chromeModal, chromePath } = useSnapshot(planState);
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isInstall, setIsInstall] = useState<boolean>(false);

  useEffect(() => {
    const l1 = listen("install_log", (event) => {
      setLogs((logs) => [...logs, event.payload as string]);
    });
    return () => {
      l1.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    invoke("detect_chrome").then((res) => {
      setChromePath(res as string);
    });
  }, []);

  return (
    <>
      <Modal
        isOpen={chromeModal}
        onOpenChange={() => {
          hideChromeModal();
          setLogs([]);
        }}
        placement="top-center"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-slate-700">
                执行环境检测
              </ModalHeader>
              <ModalBody>
                {chromePath ? (
                  <>
                    <span className="text-xs text-gray-500">
                      Chrome已经安装完成, 请点击「运行」按钮重新执行任务
                    </span>
                    <Textarea
                      isReadOnly
                      labelPlacement="outside"
                      value={chromePath}
                      className="mb-4"
                      color="primary"
                    />
                  </>
                ) : (
                  <>
                    <div className="text-xs text-gray-500">
                      找不到可执行的Chrome, 请点击右侧按钮进行安装 
                      <Button
                        className="ml-2"
                        color="primary"
                        size="sm"
                        disabled={isInstall}
                        onClick={async () => {
                          setIsInstall(true);
                          await invoke("install_chrome", {});
                          setIsInstall(false);
                          invoke("detect_chrome").then((res) => {
                            setChromePath(res as string);
                          });
                        }}
                      >
                        立即安装
                      </Button>
                    </div>
                    <ScrollShadow
                      className="rounded-medium p-4 mb-2 h-[200px]"
                      style={{ backgroundColor: "#363449", color: "#f4f4f4" }}
                      isEnabled={false}
                      size={0}
                      ref={scrollRef}
                    >
                      {logs.map((log, index) => (
                        <p key={index}>{log}</p>
                      ))}
                    </ScrollShadow>
                  </>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
