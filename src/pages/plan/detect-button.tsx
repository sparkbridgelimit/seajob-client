import {
  ModalContent,
  ModalHeader,
  ModalBody,
  Modal,
  useDisclosure,
  Button,
  Textarea,
} from "@nextui-org/react";
import { invoke } from "@tauri-apps/api";
import { useState } from "react";

export default function DetectButton({}) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [path, setPath] = useState<string>("");

  return (
    <>
      <Button
        color="primary"
        variant="shadow"
        onPress={async () => {
          onOpen();
          invoke("detect_chrome").then((res) => {
            console.log(res);
            setPath(res as string);
          });
        }}
      >
        检测Chrome执行路径
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="text-slate-700">
                执行路径检测通过
              </ModalHeader>
              <ModalBody>
                <Textarea
                  isReadOnly
                  labelPlacement="outside"
                  placeholder="Enter your description"
                  value={path}
                  className="mb-4"
                  color="primary"
                />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
