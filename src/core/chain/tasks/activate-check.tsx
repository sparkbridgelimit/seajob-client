// activate-check.tsx

import { useState, useEffect } from "react";
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
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { activateCodeConsume, checkMemberValid } from "@/api/auth";
import { useToast } from "@/hooks/use-toast";
import { actions } from "@/store/auth";
import { TaskComponent } from "../types";
import { useQuery, useQueryClient } from "react-query";
import { MyContext } from "../biz";

const formSchema = z.object({
  activateCode: z.string().regex(/^\d{8}$/, "激活码必须是8位数字"),
});

const CheckUserActivation: TaskComponent<MyContext> = ({
  onResolve,
  onReject,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 使用 react-query 检查用户激活状态
  const { data: isActivated, isLoading, isError } = useQuery<boolean>(
    "checkMemberValid",
    checkMemberValid,
    {
      retry: 3,
      staleTime: 0, // 保证每次加载时数据是最新的
    }
  );

  // 使用 useEffect 来处理副作用
  useEffect(() => {
    if (isLoading) {
      return; // 数据正在加载，什么也不做
    }

    if (isError) {
      toast({
        description: "检查激活状态失败，请稍后重试",
      });
      onReject("检查激活状态失败");
    } else if (isActivated) {
      onResolve(); // 用户已激活，继续下一步
    } else {
      setIsDialogOpen(true); // 用户未激活，打开激活对话框
    }
  }, [isLoading, isError, isActivated]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activateCode: "",
    },
  });

  const {
    formState: { isSubmitting },
    reset,
  } = form;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const success = await activateCodeConsume({ code: values.activateCode });
      if (!success) {
        toast({ description: "激活失败" });
        return;
      }

      toast({ description: "激活成功" });

      // 激活成功后刷新缓存
      await queryClient.invalidateQueries("checkMemberValid");

      // 从缓存中获取最新激活状态
      const newIsActivated = queryClient.getQueryData<boolean>(
        "checkMemberValid"
      );

      if (newIsActivated) {
        setIsDialogOpen(false);
        onResolve();
        actions.queryMemberInfo();
      } else {
        toast({ description: "激活状态更新失败，请稍后重试" });
        onReject("激活状态更新失败");
      }
    } catch (e) {
      console.error(e);
      toast({ description: "激活失败" });
    }
  }

  if (!isDialogOpen) {
    return null; // 如果未打开对话框，避免渲染组件
  }

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          onReject("用户主动取消");
        }
        setIsDialogOpen(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>激活账户</DialogTitle>
        </DialogHeader>
        <p>您的账户未激活，请立即激活以继续使用功能。</p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="activateCode"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="8位激活码" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
                onMouseDown={(e) => e.preventDefault()}
              >
                激活
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onReject("用户主动取消");
                  reset();
                  setIsDialogOpen(false);
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

export default CheckUserActivation;