import router from "@/router";
import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import { Popconfirm, Space } from "antd";
import { useCallback, useEffect } from "react";
import jobDefineState, {
  deleteJobDefineById,
  fetchJobDefines,
} from "@/store/job_define";
import { useSnapshot } from "valtio";
import moment from "moment";
import { Button } from "@/components/ui/button";
import useBizChain from "@/core/chain/hook";
import startBiz, { MyContext } from "@/core/chain/biz";
import { invoke } from "@/utils/invoke";
import { showRunLogModal } from "@/store/plan";
import { toast } from "@/hooks/use-toast";

const columns = [
  {
    key: "job_define_name",
    label: "计划名称",
  },
  {
    key: "job_define_desc",
    label: "计划描述",
  },
  {
    key: "keyword",
    label: "投递关键字",
  },
  {
    key: "total_apply",
    label: "总沟通数",
  },
  {
    key: "last_run_time",
    label: "最近运行时间",
  },
  {
    key: "create_time",
    label: "创建时间",
  },
  {
    key: "action",
    label: "操作",
  },
];

interface QueryParams {
  [key: string]: string | number | boolean;
}

function getMarketUrl(queryParams: QueryParams = {}): string {
  return `https://www.zhipin.com/web/geek/job?${Object.keys(queryParams)
    .map((key) => `${key}=${encodeURIComponent(String(queryParams[key]))}`)
    .join("&")}`;
}

export default function PlanTable() {
  const state = useSnapshot(jobDefineState);
  const { Chain, run } = useBizChain<MyContext>(startBiz);

  useEffect(() => {
    fetchJobDefines();
  }, []);

  const deleteJobDefineHandler = async (id: number) => {
    console.log("删除记录的ID:", id);
    await deleteJobDefineById(id);
  };

  const clearDir = async (item: any) => {
    const res = await invoke("clear_user_data_dir", {
      id: String(item.id),
      payload: {},
    });
    console.log(res);
    toast({
      description: "清除成功"
    })
  }

  const showWeb = async (item: any) => {
    const params = {
      query: item.keyword,
      city: item.city_code,
      page: 1,
    }
    const url = getMarketUrl(params);
    await invoke("launch_browser", {
      id: String(item.id),
      task: 'open_browser',
      payload: {
        url,
      },
      headless: false,
      autoClose: false,
    });
  }

  const runJob = async (id: number) => {
    const initialContext: MyContext = {
      id,
    };

    const { success, result, errors = [] } = await run(initialContext);
    console.log(success, result, errors)
    if (success) {
      showRunLogModal();
      await invoke("run_job_define", {
        id,
        count: Number(result.count),
        headless: result.see,
      });
    } else {
      toast({
        title: "任务启动结果",
        description: errors.map((item, index) => {
          return <div key={index}>{item.taskName}:{item.error}</div>
        })
      })
    }
  };

  // 渲染单元格内容
  const renderCell = useCallback((item: any, columnKey: any) => {
    switch (columnKey) {
      case "status":
        return (
          <Chip className="capitalize" color="warning" size="sm" variant="flat">
            未开始
          </Chip>
        );
      case "action":
        return (
          <Space>
            <Button size="sm" variant="outline" onClick={() => runJob(item.id)}>
              运行
            </Button>
            <Button size="sm" variant="outline" onClick={() => showWeb(item)}>
              打开浏览器
            </Button>
            <Button size="sm" variant="outline" onClick={() => clearDir(item)}>
              清除缓存
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.navigate(`/plan/${item.id}`)}
            >
              编辑
            </Button>

            <Popconfirm
              title="删除投递计划"
              description="删除后不可恢复，确定删除吗？"
              onConfirm={() => deleteJobDefineHandler(item.id)}
              onCancel={() => {}}
              okText="确认"
              cancelText="取消"
            >
              <Button color="danger" size="sm" variant="outline">
                删除
              </Button>
            </Popconfirm>
            <Button
              color="default"
              size="sm"
              variant="outline"
              className="text-slate-600"
              onClick={() => {
                showRunLogModal();
              }}
            >
              日志
            </Button>
          </Space>
        );
      case "last_run_time":
        if (!item[columnKey]) {
          return "--";
        }
        return moment(item[columnKey]).format("YYYY-MM-DD HH:mm:ss");
      case "total_apply":
        if (item[columnKey]) {
          return item[columnKey];
        }
        return "0";
      default:
        return item[columnKey] || "--";
    }
  }, []);

  return (
    <>
      <Table color="primary" selectionMode="single">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody items={state.list} emptyContent={"暂无投递计划, 请添加"}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell className="text-slate-600">
                  {renderCell(item, columnKey)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Chain />
    </>
  );
}
