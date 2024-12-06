import { deleteJobDefine, getJobDefineList } from '@/api/job_define';
import { proxy } from 'valtio';

interface IJobDefine {
  id: number;
  job_define_name: string;
  job_define_desc: string;
  keyword: string;
  total_apply: number;
  last_run_time: string;
  create_time: string;
  city_code: string;
  salary_range: string;
}

interface State {
  list: IJobDefine[];
}

const jobDefineState = proxy<State>({
  list: [],
});

export const fetchJobDefines = async () => {
  try {
    const jobDefineList = await getJobDefineList();
    jobDefineState.list = jobDefineList; // 更新状态
  } catch (error) {
    console.error('Failed to update job define state:', error);
  }
};


export const setJobDefines = (list: IJobDefine[]) => {
  jobDefineState.list = list;
}

export const deleteJobDefineById = async (id: number) => {
  console.log("删除记录的ID:",);
  try {
    await deleteJobDefine(id);
    jobDefineState.list = jobDefineState.list.filter((item) => item.id !== id);
  } catch (error) {
    console.error(error);
  }
  // 本地删除
};

export default jobDefineState;
