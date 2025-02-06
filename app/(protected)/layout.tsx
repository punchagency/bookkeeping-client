import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { VoiceCommandButton } from "@/components/voice-command-button";


export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <main className="p-2">
        <SidebarTrigger />
        {children}
        <VoiceCommandButton/>
      </main>
    </SidebarProvider>
  );
}
