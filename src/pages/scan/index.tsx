import { Modal } from "antd";
import QRCode from "react-qr-code";
import "./index.css";

export interface IProps {
  open: boolean;
  qrCode?: string;
  onClose?: () => void;
}

export default function Scan({ open = true, qrCode = "", onClose = () => {}}: IProps) {
  return (
    <Modal
      open={open}
      onCancel={() => onClose()}
      footer={null}
      className="scan-modal"
      width={468}
    >
      <div className="flex justify-center items-center">
        <div className="bg-white flex overflow-hidden">
          <div className="bg-white w-full flex flex-col justify-center items-center relative">
            <h2 className="text-[#353535] text-xl">BOSS直聘APP扫码登录</h2>
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
                <span>APP下载</span>
                <i className="fas fa-question-circle mt-2"></i>
              </div>
              <div className="flex flex-col items-center">
                <span>扫码帮助</span>
                <i className="fas fa-question-circle mt-2"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
