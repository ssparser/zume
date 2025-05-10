"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Plus,
  ReceiptText,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { useProject } from "@/hooks/use-projects";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboard /> },
  { title: "AI", url: "/ai", icon: <Sparkles /> },
  { title: "Billing", url: "/billing", icon: <ReceiptText /> },
];

export function AppSidebar() {

  const { projects, projectId, setProjectId } = useProject();
  return (
    <Sidebar variant="floating">
      <SidebarHeader>
        <div className="flex flex-row gap-2">
          {/* Logo */}
          <p className="text-primary text-xl font-bold">ZUME.AI</p>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="hover:bg-primary">
                    <Link href={item.url}>
                      <div className="flex items-center space-x-2">
                        {item.icon}
                        <span>{item.title}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects?.map((project) => (
                <SidebarMenuItem key={project.projectName}>
                  <SidebarMenuButton asChild className="hover:bg-primary">
                    <Link
                      href={"/dashboard"}
                      onClick={() => setProjectId(project.id)}
                    >
                      <div
                        className={cn(
                          "text-primary flex size-5 items-center justify-center gap-2 rounded-sm border bg-white text-sm",
                          {
                            "bg-primary text-white": project.id === projectId,
                          },
                        )}
                      >
                        {project.projectName[0]}
                      </div>
                      {project.projectName}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <Link href={"/create-project"}>
                  <Button variant="outline" className="cursor-pointer">
                    {" "}
                    <Plus />
                    Create Project
                  </Button>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
      </SidebarContent>
    </Sidebar>
  );
}
