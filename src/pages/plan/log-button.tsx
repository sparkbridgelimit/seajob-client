import {
  ModalContent,
  ModalHeader,
  ModalBody,
  Modal,
  useDisclosure,
  Button,
  ScrollShadow,
} from "@nextui-org/react";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

export default function LogButton({}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
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

  return (
    <>
      <Button
        color="default"
        size="sm"
        variant="ghost"
        className="text-slate-600"
        onPress={onOpen}
      >
        日志
      </Button>
      <Modal
        size="4xl"
        isOpen={isOpen}
        onOpenChange={onOpenChange}
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
