import React from 'react';
import { AccountManager } from '../AccountManager';
import { ServerControl } from '../ServerControl';
import { CommandPanel } from '../CommandPanel';
import { StatusPanel } from '../StatusPanel';
import LogsConsole, { LogEntry } from '../LogsConsole';
import { DashboardCards } from './DashboardCards';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Account {
  id: string;
  email: string;
  password: string;
  isOnline: boolean;
  isSelected: boolean;
  lastActivity?: string;
  connectionTime?: number;
}

interface ChatMessage {
  id: string;
  text: string;
  targetAccounts: string[];
  isEnabled: boolean;
}

interface LoopSettings {
  isEnabled: boolean;
  delay: number;
  cycleDelay: number;
}

interface ServerConfig {
  ip: string;
  port: string;
}

interface DashboardContentProps {
  activeSection: string;
  accounts: Account[];
  chatMessages: ChatMessage[];
  serverConfig: ServerConfig;
  loopSettings: LoopSettings;
  isLoopActive: boolean;
  logs: LogEntry[];
  // Event handlers
  onAddAccount: (email: string, password: string) => void;
  onRemoveAccount: (id: string) => void;
  onToggleAccountSelection: (id: string) => void;
  onSelectAllAccounts: () => void;
  onDeselectAllAccounts: () => void;
  onSelectAccountRange: (startIndex: number, endIndex: number) => void;
  onConnectSelectedAccounts: () => void;
  onDisconnectSelectedAccounts: () => void;
  onUpdateServerConfig: (config: ServerConfig) => void;
  onAddChatMessage: () => void;
  onUpdateChatMessage: (id: string, updates: Partial<ChatMessage>) => void;
  onRemoveChatMessage: (id: string) => void;
  onAssignSelectedAccountsToMessage: (messageId: string) => void;
  onSendSingleMessage: (messageId: string) => void;
  onUpdateLoopSettings: (settings: LoopSettings) => void;
  onStartMessageLoop: () => void;
  onStopMessageLoop: () => void;
  onClearLogs: () => void;
  onExportLogs: () => void;
}

export function DashboardContent({ 
  activeSection, 
  accounts, 
  chatMessages, 
  serverConfig, 
  loopSettings, 
  isLoopActive, 
  logs,
  onConnectSelectedAccounts,
  onDisconnectSelectedAccounts,
  ...handlers 
}: DashboardContentProps) {

  const renderContent = () => {
    switch (activeSection) {
      case 'accounts':
        return (
          <div className="space-y-6">
            <DashboardCards 
              accounts={accounts}
              serverConfig={serverConfig}
              isLoopActive={isLoopActive}
              onQuickConnect={onConnectSelectedAccounts}
              onQuickDisconnect={onDisconnectSelectedAccounts}
            />
            <Card className="bg-gradient-panel border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>Account Management</span>
                </CardTitle>
                <CardDescription>
                  Manage your Minecraft accounts and their connection status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AccountManager
                  accounts={accounts}
                  onAddAccount={handlers.onAddAccount}
                  onRemoveAccount={handlers.onRemoveAccount}
                  onToggleSelection={handlers.onToggleAccountSelection}
                  onSelectAll={handlers.onSelectAllAccounts}
                  onDeselectAll={handlers.onDeselectAllAccounts}
                  onSelectRange={handlers.onSelectAccountRange}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 'server':
        return (
          <div className="space-y-6">
            <DashboardCards 
              accounts={accounts}
              serverConfig={serverConfig}
              isLoopActive={isLoopActive}
              onQuickConnect={onConnectSelectedAccounts}
              onQuickDisconnect={onDisconnectSelectedAccounts}
            />
            <Card className="bg-gradient-panel border-border shadow-card">
              <CardHeader>
                <CardTitle>Server Configuration</CardTitle>
                <CardDescription>
                  Configure the Minecraft server connection settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ServerControl
                  serverConfig={serverConfig}
                  onServerConfigChange={handlers.onUpdateServerConfig}
                  onConnect={onConnectSelectedAccounts}
                  onDisconnect={onDisconnectSelectedAccounts}
                  selectedAccountsCount={accounts.filter(acc => acc.isSelected).length}
                  connectedAccountsCount={accounts.filter(acc => acc.isOnline).length}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 'commands':
        return (
          <div className="space-y-6">
            <DashboardCards 
              accounts={accounts}
              serverConfig={serverConfig}
              isLoopActive={isLoopActive}
              onQuickConnect={onConnectSelectedAccounts}
              onQuickDisconnect={onDisconnectSelectedAccounts}
            />
            <Card className="bg-gradient-panel border-border shadow-card">
              <CardHeader>
                <CardTitle>Command Panel</CardTitle>
                <CardDescription>
                  Manage chat messages and automated message loops
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CommandPanel
                  chatMessages={chatMessages}
                  accounts={accounts}
                  loopSettings={loopSettings}
                  isLoopActive={isLoopActive}
                  onAddChatMessage={handlers.onAddChatMessage}
                  onUpdateChatMessage={handlers.onUpdateChatMessage}
                  onRemoveChatMessage={handlers.onRemoveChatMessage}
                  onAssignSelectedAccounts={handlers.onAssignSelectedAccountsToMessage}
                  onSendSingleMessage={handlers.onSendSingleMessage}
                  onLoopSettingsChange={handlers.onUpdateLoopSettings}
                  onStartLoop={handlers.onStartMessageLoop}
                  onStopLoop={handlers.onStopMessageLoop}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 'status':
        return (
          <div className="space-y-6">
            <DashboardCards 
              accounts={accounts}
              serverConfig={serverConfig}
              isLoopActive={isLoopActive}
              onQuickConnect={onConnectSelectedAccounts}
              onQuickDisconnect={onDisconnectSelectedAccounts}
            />
            <Card className="bg-gradient-panel border-border shadow-card">
              <CardHeader>
                <CardTitle>Status Monitor</CardTitle>
                <CardDescription>
                  Real-time monitoring of bot status and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StatusPanel accounts={accounts} />
              </CardContent>
            </Card>
          </div>
        );

      case 'logs':
        return (
          <div className="space-y-6">
            <DashboardCards 
              accounts={accounts}
              serverConfig={serverConfig}
              isLoopActive={isLoopActive}
              onQuickConnect={onConnectSelectedAccounts}
              onQuickDisconnect={onDisconnectSelectedAccounts}
            />
            <Card className="bg-gradient-panel border-border shadow-card">
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>
                  View system events, errors, and activity logs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LogsConsole
                  logs={logs}
                  onClearLogs={handlers.onClearLogs}
                  onExportLogs={handlers.onExportLogs}
                />
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="animate-fade-in">
        {renderContent()}
      </div>
    </ScrollArea>
  );
}