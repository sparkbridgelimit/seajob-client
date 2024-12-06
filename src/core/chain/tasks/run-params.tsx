import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "@/hooks/use-toast"; // 根据您的项目路径
import { Switch } from "@/components/ui/switch";
import { TaskComponent } from "../types";
import { MyContext } from "../biz";

const formSchema = z.object({
  count: z.preprocess(
    (val) => Number(val),
    z.number().gt(0, "打招呼个数必须大于0")
  ),
  see: z.boolean().default(true),
});

const RunParamsTask: TaskComponent<MyContext> = ({
  onResolve,
  onReject,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      count: 1,
      see: true,
    },
  });

  const {
    formState: { isSubmitting },
    reset,
  } = form;

  const headlessValue = form.watch("see");

  // 用户点击对话框关闭(ESC或点击遮罩)
  const handleDialogClose = () => {
    setIsOpen(false);
    onReject("用户主动取消");
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsOpen(false);
      // 成功启动
      onResolve(values);
    } catch (e) {
      console.log(e);
      toast({
        description: "启动失败",
      });
      onReject("启动失败");
      setIsOpen(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>运行参数设置</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between p-3">
                  <div className="space-y-0.5 w-32">
                    <FormLabel>打招呼个数</FormLabel>
                  </div>
                  <FormControl className="flex-grow">
                    <Input placeholder="大于0" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="see"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>是否观看执行过程</FormLabel>
                    <FormDescription>
                      {headlessValue
                        ? "观看整个任务的执行过程。"
                        : "任务将在后台高效执行。"}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      onMouseDown={(e) => e.preventDefault()}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
                onMouseDown={(e) => e.preventDefault()}
              >
                启动
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  reset();
                  onReject("用户主动取消");
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                取消
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default RunParamsTask;
