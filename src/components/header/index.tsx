import { activateCodeConsume } from "@/api/auth";
import router from "@/router";
import auth, { actions } from "@/store/auth";
import { Button } from "@nextui-org/button";
import {
  Avatar,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Input,
  useDisclosure,
} from "@nextui-org/react";
import { message, Space } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSnapshot } from "valtio";

export default function Header() {
  const { isLogin, memberLabel, memberLabelColor } = useSnapshot(auth);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [code, setCode] = useState<string>("");

  let location = useLocation();

  useEffect(() => {
    if (isLogin) {
      actions.queryMemberInfo();
    }
  }, []);

  const isShowUserMenu = () => {
    const needAuthRoutes = ['/signup', '/signin'].indexOf(location.pathname) === -1;
    return isLogin && needAuthRoutes;
  };

  const NotAuth = useMemo(() => {
    return (
      <div>
        {location.pathname === "/signin" && (
          <Link to="/signup">
            <Space>
              <span className="text-sm font-medium text-gray-600 hover:text-gray-900">
                没有账号?
              </span>
              <Button color="primary">注册</Button>
            </Space>
          </Link>
        )}
        {location.pathname === "/signup" && (
          <Link to="/signin">
            <Space>
              <span className="text-sm font-medium text-gray-600 hover:text-gray-900">
                已有账号?
              </span>
              <Button color="primary">登陆</Button>
            </Space>
          </Link>
        )}
      </div>
    );
  }, []);

  const signOut = async () => {
    try {
      await actions.signout();
    } catch (e) {}
    router.navigate("/signin");
  };

  const userMenu = useMemo(() => {
    return (
      <div>
        <Space>
          <Chip color={memberLabelColor} className="text-gray-100">
            {memberLabel}
          </Chip>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar isBordered color="primary" showFallback />
            </DropdownTrigger>
            <DropdownMenu variant="flat">
              <DropdownItem key="active" onClick={onOpen}>
                激活码兑换
              </DropdownItem>
              <DropdownItem key="logout" onClick={() => signOut()}>
                <span className="text-gray-600">登出</span>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </Space>
      </div>
    );
  }, [isLogin, memberLabel]);

  return (
    <>
      <div className="flex justify-between items-center p-8">
        <div className="flex items-center space-x-2">
          <img src="/icon.png" alt="海投助手" className="w-10 h-10" />
          <span className="text-xl font-bold text-gray-700">海投助手</span>
        </div>
        {isShowUserMenu() ? userMenu : NotAuth}
      </div>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-slate-700">请输入激活码</ModalHeader>
              <ModalBody>
                <Input
                  placeholder="激活码"
                  value={code}
                  className="mb-4 text-slate-600"
                  color="default"
                  onChange={(e) => setCode(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={() => {
                    setCode("");
                    onClose();
                  }}
                >
                  取消
                </Button>
                <Button
                  color="primary"
                  onPress={async () => {
                    if (!code) {
                      return message.info("请输入激活码");
                    }
                    try {
                      const success = await activateCodeConsume({ code });
                      if (!success) {
                        message.info("激活失败");
                        return;
                      }
                      message.success('激活成功');
                      actions.queryMemberInfo();
                    } catch (e) {
                      console.log(e);
                      message.warning("激活失败");
                    } finally {
                      onClose();
                      setCode("");
                    }
                  }}
                >
                  兑换
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
