import { proxy } from 'valtio';

interface State {
  running: boolean;
  runningJobId: number | undefined;
}

const state = proxy<State>({
  running: false,
  runningJobId: undefined,
});

export const runTask = (jobDefineId: number) => {
  state.running = true;
  state.runningJobId = jobDefineId;
}

export const stopTask = () => {
  state.running = false;
  state.runningJobId = undefined;
}

export default state;
