import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { StatusHeader } from './StatusHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
  accounts: any[];
  serverConfig: any;
}

export function DashboardLayout({ children, accounts, serverConfig }: DashboardLayoutProps) {
  const connectedCount = accounts.filter(acc => acc.isOnline).length;
  const totalCount = accounts.length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background to-card">
        {React.Children.toArray(children).find(child => 
          React.isValidElement(child) && child.type === AppSidebar
        )}
        
        
        <div className="flex-1 flex flex-col">
          {/* Header with status and trigger */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">MC</span>
                </div>
                <h1 className="text-xl font-semibold text-foreground">McAFK Bot Manager</h1>
              </div>
            </div>
            
            <StatusHeader 
              connectedCount={connectedCount}
              totalCount={totalCount}
              serverConfig={serverConfig}
            />
          </header>

          {/* Main content area */}
          <main className="flex-1 p-6 overflow-hidden">
            <div className="flex gap-6 h-full">
              <div className="flex-1">
                {React.Children.toArray(children).find(child => 
                  React.isValidElement(child) && child.type !== AppSidebar
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}