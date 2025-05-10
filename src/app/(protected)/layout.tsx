import { AppSidebar } from "@/components/appsidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import UserComponent from "@/components/user-component";

type Props = {
  children: React.ReactNode;
};

const layout = ({ children }: Props) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="m-2 w-full">
        <div className="border-siderbar-border bg-sidebar flex items-center justify-between gap-2 rounded-md border p-2 px-4 shadow">
          {/* <SearchBar/> */}
          <SidebarTrigger className="cursor-pointer" />
          <div className="flex flex-row items-center gap-2">
            <ThemeToggle />
            <UserComponent />
          </div>
        </div>
        <div className="h-4" />
        <div className="border-sidebar-border bg-sidebar h-[calc(100dvh-95px)] overflow-y-scroll rounded-md border p-4 shadow">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
};

export default layout;
