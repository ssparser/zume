'use client'
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Bot, LayoutDashboard, LogOutIcon, MoreVerticalIcon, Plus, ReceiptText, UserCircleIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { useProject } from "@/hooks/use-projects";
import { SignedIn, useClerk,  } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { clearSession } from "@/lib/session";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboard /> },
  { title: "Q/A", url: "/qa", icon: <Bot /> },
  { title: "Billing", url: "/billing", icon: <ReceiptText /> },
];


export function AppSidebar() {
  const { isMobile } = useSidebar();
    const { user } = useUser();

  const clerk = useClerk();
  const handleLogout = async () => {
    try {
        await clearSession();
        await clerk.signOut();

    } catch (error) {
        console.error("Logout failed:", error);
    }
};
  const {projects, projectId, setProjectId} = useProject()
  return (
    <Sidebar  variant="floating">
      <SidebarHeader>
        <div className="flex flex-row  gap-2">
        Logo
        <p className="text-primary text-xl font-bold ">ZUME</p>
          </div></SidebarHeader>
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
                    <Link href={'/dashboard'} onClick={() => setProjectId(project.id)}>
                      <div
                        className={cn(
                          "text-primary flex size-5 gap-2 items-center justify-center rounded-sm border bg-white text-sm",
                          {
                            "bg-primary text-white":
                              project.id === projectId,
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
              <Link href={'/create-project'}>
            <Button variant="outline" className="cursor-pointer"> <Plus/>Create Project</Button>
          </Link>
              </SidebarMenuItem>

            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
<SidebarSeparator />
<SignedIn><Button onClick={handleLogout}>Logout</Button> </SignedIn>

<DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user?.imageUrl} alt="mg" />
                                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{user?.firstName}</span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {user?.emailAddresses[0]?.emailAddress}
                                </span>
                            </div>
                            <MoreVerticalIcon className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user?.imageUrl} alt="mg" />
                                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{user?.firstName}</span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {user?.emailAddresses[0]?.emailAddress}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => clerk.openUserProfile({})}>
                                <UserCircleIcon />
                                Account
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOutIcon />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
      </SidebarContent>
    </Sidebar>
  );
}
