import { checkMemberValid } from "@/api/auth";
import state from "@/store/task";
import { Button } from "@nextui-org/button";
import {
  CircularProgress,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Switch,
  useDisclosure,
} from "@nextui-org/react";
import { message } from "antd";
import { useState } from "react";
import { useSnapshot } from "valtio";

export interface RunButtonProps {
  onConfirm: (count: string, headless: boolean) => void;
  jobDefineId: number;
}

export default function RunButton({
  onConfirm = () => {},
  jobDefineId,
}: RunButtonProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [count, setCount] = useState<string>("1");
  const [isSelected, setIsSelected] = useState<boolean>(true);
  const { running, runningJobId } = useSnapshot(state);

  const runButton = () => {
    if (running && runningJobId === jobDefineId) {
      return (
        <Button
          color="primary"
          size="sm"
          disabled
          isLoading
          spinner={<CircularProgress size="sm" />}
        >
          运行中
        </Button>
      );
    }
    if (runningJobId) {
      return (
        <Button color="primary" variant="ghost" size="sm" disabled>
          等待中
        </Button>
      );
    }
    return (
      <Button color="primary" size="sm" onPress={onOpen}>
        运行
      </Button>
    );
  };

  return (
    <>
      {runButton()}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-slate-700">
                想要和多少老板打招呼？
              </ModalHeader>
              <ModalBody>
                <Input
                  label="个数"
                  placeholder="预期个数"
                  type="text"
                  variant="bordered"
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                />
                <span className="text-slate-600">是否观看执行过程</span>
                <Switch isSelected={isSelected} onValueChange={setIsSelected} />
                <span className="text-gray-600 text-xs">
                  {isSelected ? "躲墙角偷偷看一下" : "不看不看, 眼不见心不烦好"}
                </span>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={() => {
                    onClose();
                  }}
                >
                  取消
                </Button>
                <Button
                  color="primary"
                  onPress={async () => {
                    const valid = await checkMemberValid();
                    if (valid) {
                      onConfirm(count, !isSelected);
                    } else {
                      message.error("用户未激活")
                    }
                    onClose();
                  }}
                >
                  确定
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
