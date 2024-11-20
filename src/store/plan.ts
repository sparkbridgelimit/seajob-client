import { proxy } from 'valtio';

interface State {
  chromeDetechModal: boolean,
  chromeModal: boolean,
  runLogModal: boolean,
  chromePath: string,
}

const planState = proxy<State>({
  chromeDetechModal: false,
  chromeModal: false,
  runLogModal: false,
  chromePath: ""
});


export const showRunLogModal = () => {
  planState.runLogModal = true;
}

export const hideRunLogModal = () => {
  planState.runLogModal = false;
}

export const setChromePath = (path: string) => {
  planState.chromePath = path;
}

export const showChromeModal = () => {
  planState.chromeModal = true;
}

export const hideChromeModal = () => {
  planState.chromeModal = false;
}

export default planState;
