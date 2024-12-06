import moment from "moment";
import { request } from "./request";

export async function getJobDefineList(): Promise<any[]> {
  // 直接返回调用 request 的结果
  const response = await request({
    app: 'seajob',
    path: '/api/s/job_define/list',
  }) as [];

  // 确保 response 是期望的数组结构，格式化时间字段
  return (response || []).map((item: any) => ({
    ...item,
    create_time: moment(item.create_time).format('YYYY-MM-DD HH:mm:ss'),
    update_time: moment(item.update_time).format('YYYY-MM-DD HH:mm:ss'),
  }));
}

export async function deleteJobDefine(job_define_id: number) {
  return await request({
    app: 'seajob',
    path: '/api/s/job_define/delete',
    data: {
      job_define_id
    }
  });
}

export interface CreateJobDefineRequest {
  job_define_name: string;
  job_define_desc?: string;
  keyword: string;
  city_code: string;
  salary_range: string;
  key_kills?: string;
  exclude_company?: string;
  exclude_job?: string;
}

export async function createJobDefine(req: CreateJobDefineRequest) {
  return await request({
    app: 'seajob',
    path: '/api/s/job_define/create',
    data: req
  })
}

export type IJobDefineDetailReq = {
    job_define_id: number;
}

export async function getJobDefineDetail({
  job_define_id,
}: IJobDefineDetailReq) {
  return await request({
    app: 'seajob',
    path: '/api/s/job_define/detail',
    data: {
      job_define_id,
    }
  });
}

export type IJobDefineSaveReq = {
  id?: number;
  job_define_name?: string;
  job_define_desc?: string;
  keyword?: string;
  city_code?: string;
  salary_range?: [number, number];
  key_kills?: string[];
  exclude_company?: string[];
  exclude_job?: string[];
  hello_text?: string;
}

export async function saveJobDefineDetail(data: IJobDefineSaveReq) {
  return await request({
    app: 'seajob',
    path: '/api/s/job_define/update',
    data
  });
}

export type ILogTaskReq = {
  job_task_id: number;
  job_name: string;
  company: string;
  job_link: string;
  salary_range: number[]
}

export async function log_task(data: ILogTaskReq) {
  return await request({
    app: 'seajob',
    path: '/api/s/job_task/log',
    data
  });
}