import {
  ModalContent,
  ModalHeader,
  ModalBody,
  Modal,
  useDisclosure,
  Button,
  ScrollShadow,
  Textarea,
} from "@nextui-org/react";
import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

export default function InstallButton({}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [path, setPath] = useState<string>("");
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
    // 当日志更新时，自动滚动到底部
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <>
      <Button
        color="primary"
        onPress={() => {
          onOpen();
          invoke("detect_chrome").then((res) => {
            console.log(res);
            setPath(res as string);
          });
        }}
      >
        执行环境检测
      </Button>
      <Modal
        // size="2xl"
        isOpen={isOpen}
        onOpenChange={() => {
          onOpenChange();
          setPath("");
          setLogs([]);
        }}
        placement="top-center"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-slate-700">
                检测结果
              </ModalHeader>
              <ModalBody>
                {path ? (
                  <>
                    <span className="text-xs text-gray-500">
                      检测通过, 系统将用下面的Chrome启动打招呼任务
                    </span>
                    <Textarea
                      isReadOnly
                      labelPlacement="outside"
                      value={path}
                      className="mb-4"
                      color="primary"
                    />
                  </>
                ) : (
                  <>
                    <div className="text-xs text-gray-500">
                      找不到Chrome, 点击👉
                      <Button
                        color="primary"
                        size="sm"
                        isLoading={isInstall}
                        onPress={async () => {
                          setIsInstall(true);
                          await invoke("install_chrome", {});
                          setIsInstall(false);
                          invoke("detect_chrome").then((res) => {
                            console.log(res);
                            setPath(res as string);
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
