import router from "@/router";
import {
  Button,
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
import RunButton from "./run-job-button";
import { invoke } from "@tauri-apps/api";
import jobDefineState, {
  deleteJobDefineById,
  fetchJobDefines,
} from "@/store/job_define";
import { useSnapshot } from "valtio";
import LogButton from "./log-button";
import dayjs from "dayjs";
import moment from "moment";

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

export default function PlanTable() {
  const state = useSnapshot(jobDefineState);

  useEffect(() => {
    fetchJobDefines();
  }, []);

  const deleteJobDefineHandler = async (id: number) => {
    console.log("删除记录的ID:", id);
    await deleteJobDefineById(id);
  };

  const runJob = async (id: number, count: string, headless: boolean) => {
    // 处理查看操作，例如跳转到详情页或显示模态框
    console.log("查看记录的ID:", id, count);
    await invoke("run_job_define", {
      id,
      count: Number(count),
      headless,
    });
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
            <RunButton
              jobDefineId={item.id}
              onConfirm={(count, headless) => runJob(item.id, count, headless)}
            />
            <Button
              color="primary"
              size="sm"
              variant="ghost"
              onClick={() => router.navigate(`/plan/${item.id}`)}
            >
              详情
            </Button>

            <Popconfirm
              title="删除投递计划"
              description="删除后不可恢复，确定删除吗？"
              onConfirm={() => deleteJobDefineHandler(item.id)}
              onCancel={() => {}}
              okText="确认"
              cancelText="取消"
            >
              <Button color="danger" size="sm" variant="ghost">
                删除
              </Button>
            </Popconfirm>
            <LogButton />
          </Space>
        );
      case "last_run_time":
        if (!item[columnKey]) {
          return "--";
        }
        return moment(item[columnKey]).format("YYYY-MM-DD HH:mm:ss");
      default:
        return item[columnKey] || '--';
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
    </>
  );
}
