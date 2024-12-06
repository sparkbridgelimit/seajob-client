import { TaskComponent, TaskItem, ChainContextBase } from './types';

type OnChainComplete = (success: boolean, errors?: any[], result?: any) => void;
type OnTaskChange<U> = (taskIndex: number | null, ctx: U) => void;

export type MergedContext<U> = U & ChainContextBase;

class BizChain<U> {
  private tasks: TaskItem<U>[] = [];
  private context: MergedContext<U> | null = null;
  private currentTaskIndex: number | null = null;
  private resolveChain?: (value: { success: boolean; errors?: any[]; result?: any }) => void;
  private onComplete?: OnChainComplete;
  private onTaskChange?: OnTaskChange<MergedContext<U>>;

  register(
    taskId: string | number,
    taskName: string,
    taskComponent: TaskComponent<U>
  ) {
    this.tasks.push({ taskId, taskName, taskComponent });
  }

  setOnComplete(callback: OnChainComplete) {
    this.onComplete = callback;
  }

  setOnTaskChange(callback: OnTaskChange<MergedContext<U>>) {
    this.onTaskChange = callback;
  }

  run(userContext: U): Promise<{ success: boolean; errors?: any[]; result?: any }> {
    this.initContext(userContext);
    this.currentTaskIndex = 0;
    this.notifyTaskChange();
    return new Promise((resolve) => {
      this.resolveChain = resolve;
    });
  }

  handleResolve(output?: any) {
    if (this.currentTaskIndex === null || this.context === null) return;

    const currentTask = this.tasks[this.currentTaskIndex];
    this.context.setResult(currentTask.taskId, output);

    this.context.prevTaskId = currentTask.taskId;
    this.context.prevTaskOutput = output;

    const nextIndex = this.currentTaskIndex + 1;
    if (nextIndex < this.tasks.length) {
      this.currentTaskIndex = nextIndex;
      this.context.currentTaskId = this.tasks[nextIndex].taskId;
      this.notifyTaskChange();
    } else {
      // 完成
      this.context.isRunning = false;
      this.finishChain(true, this.context.prevTaskOutput);
    }
  }

  handleReject(err: any) {
    if (this.currentTaskIndex === null || this.context === null) return;

    const currentTask = this.tasks[this.currentTaskIndex];
    this.context.addError(currentTask.taskId, currentTask.taskName, err);
    this.context.isRunning = false;

    this.finishChain(false);
  }

  getCurrentTask(): TaskItem<U> | null {
    if (this.currentTaskIndex === null) return null;
    return this.tasks[this.currentTaskIndex] || null;
  }

  private initContext(userContext: U) {
    const base: ChainContextBase = {
      isRunning: true,
      errors: [],
      results: {},
      currentTaskId: undefined,
      prevTaskId: undefined,
      prevTaskOutput: undefined,

      getResult(taskId: string | number) {
        return this.results[taskId];
      },
      setResult(taskId: string | number, output: any) {
        this.results[taskId] = output;
      },
      getCurrentTaskId() {
        return this.currentTaskId;
      },
      getPrevTaskOutput() {
        return this.prevTaskOutput;
      },
      addError(taskId: string | number, taskName: string, error: any) {
        this.errors.push({ taskId, taskName, error });
      },
    };

    this.context = { ...userContext, ...base } as MergedContext<U>;
  }

  private notifyTaskChange() {
    if (this.onTaskChange && this.context !== null) {
      this.onTaskChange(this.currentTaskIndex, this.context);
    }
  }

  private finishChain(success: boolean, result?: any) {
    if (this.resolveChain && this.context) {
      this.resolveChain({ success, errors: this.context.errors, result });
    }
    if (this.onComplete && this.context) {
      this.onComplete(success, this.context.errors, result);
    }
    this.currentTaskIndex = null;
  }
}

export default BizChain;