import api from '@/api';
import { IJobDefineSaveReq } from '@/api/job_define';
import { proxy } from 'valtio'

interface State {
  city_code: string;
  exclude_company: string[];
  exclude_job: string[];
  hello_text: string;
  interval: number;
  job_define_desc: string;
  job_define_id: number;
  job_define_name: string;
  key_kills: string[];
  keyword: string;
  salary_range: number[];
  timeout: number;
  wt2_cookie: string;
  filter_offline: boolean;
}

// 初始化 state 的默认值
const defaultState: State = {
  city_code: '',
  exclude_company: [],
  exclude_job: [],
  hello_text: "",
  interval: 0,
  job_define_desc: "",
  job_define_id: 0,
  job_define_name: "",
  key_kills: [],
  keyword: "",
  salary_range: [],
  timeout: 0,
  wt2_cookie: "",
  filter_offline: false
};

// 定义 state
const state = proxy<State>({
  ...defaultState,
});

// 异步加载 job define detail 的函数
export async function loadJobDefineDetail(id: string) {
  // state.loading = true;
  try {
    const res = await api.getJobDefineDetail({
      job_define_id: Number(id),
    });
    // 转换数据格式

    res.exclude_company = JSON.parse(res.exclude_company) || [];
    res.exclude_job = JSON.parse(res.exclude_job) || [];
    res.key_kills = JSON.parse(res.key_kills) || [];
    res.salary_range = JSON.parse(res.salary_range) || [];
    Object.assign(state, res);
  } catch (err) {
  } finally {
    // state.loading = false;
  }
}

export async function saveJobDefineDetail(data: IJobDefineSaveReq) {

  try {
    const res = await api.saveJobDefineDetail(data);
    console.log(res);
    // 转换数据格式

    // res.exclude_company = JSON.parse(res.exclude_company) || [];
    // res.exclude_job = JSON.parse(res.exclude_job) || [];
    // res.key_kills = JSON.parse(res.key_kills) || [];
    // res.salary_range = JSON.parse(res.salary_range) || [];
    // Object.assign(state, res);
  } catch (err) {
  } finally {
  }
}

export async function setSalaryRange(value: number[]) {
  state.salary_range = value;
}

export default state;