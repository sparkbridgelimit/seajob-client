import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listen } from "@tauri-apps/api/event";
import QRCode from "react-qr-code";
import { TaskComponent } from "../types"; // 根据您的路径修改
import { invoke } from "@/utils/invoke";
import { MyContext } from "../biz";

const BossScanTask: TaskComponent<MyContext> = ({
  context,
  onResolve,
  onReject,
}) => {
  const [qrCode, setQrCode] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [timer, setTimer] = useState(0);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 初始化流程
    async function init() {
      try {
        const cookieValid = await invoke("check_boss_cookie", {
          id: context.id,
        });
        if (cookieValid) {
          onResolve(true);
          return;
        }

        // cookie失效进入扫码环节
        setIsOpen(true);

        const initResult = await invoke("init_boss_cookie", {
          id: context.id,
        });
        console.log(initResult);  

      } catch (err) {
        console.error("检测或初始化Cookie出错：", err);
        onReject("检测失败");
      }
    }

    const p1 = listen("login-first-randkey", (event) => {
      setQrCode(event.payload as string);
      startTimer(25);
    });

    const p2 = listen("login-second-key", (event) => {
      setQrCode(event.payload as string);
    });

    const p3 = listen("scan-success", () => {
      setQrCode("");
      onResolve(true);
    });

    const p4 = listen("scan-failed", () => {
      setQrCode("");
      onReject("扫描失败");
    });

    init();

    return () => {
      p1.then((unlisten) => unlisten());
      p2.then((unlisten) => unlisten());
      p3.then((unlisten) => unlisten());
      p4.then((unlisten) => unlisten());

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // 启动倒计时函数
  const startTimer = (seconds: number) => {
    setTimer(seconds);
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          countdownIntervalRef.current = null;
          // 时间到期还未成功扫码
          onReject("二维码过期");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    countdownIntervalRef.current = interval;
  };

  // 对话框关闭时的处理
  const handleDialogClose = () => {
    setIsOpen(false);
    onReject("用户主动取消");
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent>
        <div className="flex justify-center items-center">
          <div className="bg-white flex overflow-hidden">
            <div className="bg-white w-full flex flex-col justify-center items-center relative">
              <DialogHeader>
                <DialogTitle className="text-[#353535] text-xl">
                  BOSS直聘APP扫码登录
                </DialogTitle>
              </DialogHeader>
              {qrCode ? (
                <>
                  <QRCode
                    className="mt-8"
                    size={256}
                    color="#00c1c1"
                    style={{ width: "200px", height: "200px" }}
                    value={qrCode}
                    viewBox={`0 0 256 256`}
                  />
                  <div className="flex space-x-8 text-sm text-[#999999] mt-8">
                    <div className="flex flex-col items-center">
                      <span>请在 {timer} 秒内扫码</span>
                      <i className="fas fa-question-circle mt-2"></i>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <p>加载二维码中...</p>
                  <i className="fas fa-spinner animate-spin mt-2 text-2xl"></i>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BossScanTask;
