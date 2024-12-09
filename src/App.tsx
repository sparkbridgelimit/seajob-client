import { RouterProvider } from "react-router-dom";
import router from "@/router";
import { QueryClientProvider } from "react-query";
import queryClient from "./lib/react-query";
import { useEffect } from "react";
import { logUtils } from "./utils/log";

function App() {
  useEffect(() => {
    let detach = () => {};

    const attachLogs = async () => {
      detach = await logUtils.attachConsoleLogs();
      console.info("Backend logs attached to console.");
    };

    attachLogs();

    return () => {
      console.info("Detaching backend logs from console.");
      detach();
    };
  }, []);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </>
  );
}

export default App;
