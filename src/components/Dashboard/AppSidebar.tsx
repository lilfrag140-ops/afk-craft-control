import React from 'react';
import { Users, Server, MessageSquare, Activity, Settings, Terminal } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navigationItems = [
  {
    title: 'Accounts',
    icon: Users,
    id: 'accounts',
    description: 'Manage Minecraft accounts'
  },
  {
    title: 'Server',
    icon: Server,
    id: 'server',
    description: 'Server connection settings'
  },
  {
    title: 'Commands',
    icon: MessageSquare,
    id: 'commands',
    description: 'Chat commands & messages'
  },
  {
    title: 'Status',
    icon: Activity,
    id: 'status',
    description: 'Bot status & monitoring'
  },
  {
    title: 'Logs',
    icon: Terminal,
    id: 'logs',
    description: 'System logs & events'
  },
];

interface AppSidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export function AppSidebar({ activeSection = 'accounts', onSectionChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar className={isCollapsed ? 'w-16' : 'w-64'} collapsible="icon">
      <SidebarContent className="bg-card/80 backdrop-blur-sm border-r border-border">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground px-4 py-2">
            {!isCollapsed && 'Navigation'}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange?.(item.id)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                      hover:bg-accent/10 hover:text-accent-foreground
                      ${activeSection === item.id 
                        ? 'bg-accent/20 text-accent border-l-2 border-accent shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                      }
                    `}
                    isActive={activeSection === item.id}
                  >
                    <item.icon className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} flex-shrink-0`} />
                    {!isCollapsed && (
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{item.title}</span>
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Stats in Sidebar */}
        {!isCollapsed && (
          <div className="mt-auto p-4 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">Quick Stats</div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs">Status</span>
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow"></div>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}