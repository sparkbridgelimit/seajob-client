import auth, { actions } from "@/store/auth";
import { Button } from "@nextui-org/button";
import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";
import { Space } from "antd";
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSnapshot } from "valtio";

export default function Header() {
  const { isLogin } = useSnapshot(auth);

  let location = useLocation();
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

  const userMenu = useMemo(() => {
    return (
      <div>
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              isBordered
              color="primary"
              showFallback
              src="https://i.pravatar.cc/150?u=a042581f4e29026024d"
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem key="logout" onClick={() => actions.signout()}>
              登出
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
    );
  }, []);

  return (
    <>
      <div className="flex justify-between items-center p-8">
        <div className="flex items-center space-x-2">
          <img src="/seajob.jpg" alt="海投助手" className="w-10 h-10" />
          <span className="text-xl font-bold text-gray-900">海投助手</span>
        </div>
        {isLogin ? userMenu : NotAuth}
      </div>
    </>
  );
}
