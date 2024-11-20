import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Calendar } from "lucide-react";

const items = [
  // {
  //   title: "账号管理",
  //   url: "#",
  //   icon: Inbox,
  // },
  {
    title: "投递计划",
    url: "#/plan",
    icon: Calendar,
  },
  // {
  //   title: "简历管理",
  //   url: "#/resume",
  //   icon: Search,
  // },
  // {
  //   title: "定时任务",
  //   url: "#",
  //   icon: Search,
  // },
  // {
  //   title: "订阅",
  //   url: "#",
  //   icon: Search,
  // },
  // {
  //   title: "日志",
  //   url: "#",
  //   icon: Settings,
  // },
]

export function AppSidebar() {
  return (
    <Sidebar className="p-4 bg-white">
      <SidebarHeader />
      <SidebarContent className="mt-8">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}
