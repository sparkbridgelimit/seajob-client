import CheckUserActivation from "./tasks/activate-check";
import BossScanTask from "./tasks/boss-scan";
import BizChain from "./chain";
import ChromeDetectTask from "./tasks/chrome-detect";
import RunParamsTask from "./tasks/run-params";

export interface MyContext {
  id: number;
}

const startBiz = new BizChain<MyContext>();

startBiz.register("task-activate", "检测用户是否激活", CheckUserActivation);
startBiz.register("task-chrome", "检查chrome是否安装", ChromeDetectTask);
startBiz.register("task-boss", "检查Boss账户是否授权", BossScanTask);
startBiz.register("task-run-params", "检查启动参数", RunParamsTask);

export default startBiz;