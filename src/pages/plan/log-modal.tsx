import planState, { hideRunLogModal } from "@/store/plan";
import {
  ModalContent,
  ModalHeader,
  ModalBody,
  Modal,
  ScrollShadow,
} from "@nextui-org/react";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import { useSnapshot } from "valtio";

export default function LogModal({}) {
  const { runLogModal } = useSnapshot(planState);

  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const l1 = listen("run_log", (event) => {
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

  const handleModalClose = (openState: any) => {
    console.log(openState);
    hideRunLogModal();
  };

  return (
    <>
      <Modal
        size="4xl"
        isOpen={runLogModal}
        onOpenChange={handleModalClose}
        placement="top-center"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-slate-700">
                运行日志
              </ModalHeader>
              <ModalBody>
                <ScrollShadow
                  className="rounded-medium p-4 mb-2 h-[600px]"
                  style={{ backgroundColor: "#363449", color: "#f4f4f4" }}
                  isEnabled={false}
                  size={0}
                  ref={scrollRef}
                >
                  {logs.map((log, index) => (
                    <p key={index}>{log}</p>
                  ))}
                </ScrollShadow>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
