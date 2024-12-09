// 定义基础消息结构
export interface StdIOMsg<T = any> {
  type: "challenge" | "job_finished"; // 消息类型
  payload: T; // 消息的负载
}

// 定义 challenge 消息的负载
export interface ChallengePayload {
  job_define_id: string;
  url: string; // 当前页面的 URL
}

// 定义 job_finished 消息的负载
export interface JobFinishedPayload { }

// 定义具体的消息类型
export type StdIOMsgWithPayload =
  | StdIOMsg<ChallengePayload>
  | StdIOMsg<JobFinishedPayload>;

export function isChallengePayload(msg: StdIOMsgWithPayload): msg is StdIOMsg<ChallengePayload> {
  return msg.type === "challenge";
}

export function isJobFinishedPayload(msg: StdIOMsgWithPayload): msg is StdIOMsg<JobFinishedPayload> {
  return msg.type === "job_finished";
}