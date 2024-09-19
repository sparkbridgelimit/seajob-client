import { RouterProvider } from "react-router-dom";
import router from "@/router";

function App() {
  // // 监听更新可用事件
  // listen("tauri://update-available", () => {
  //   console.log("更新可用");
  // });
  // // 监听下载进度
  // listen("tauri://update-download-progress", (event) => {
  // });
  // // 监听安装事件
  // listen("tauri://update-install", () => {
  //   console.log("更新下载完成，准备安装");
  // });
  // // 监听更新错误
  // listen("tauri://update-error", (event) => {
  //   console.error(`更新错误: ${event.payload}`);
  // });

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
