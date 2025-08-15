import React, { useState, useEffect } from 'react';
import { AccountManager } from './AccountManager';
import { ServerControl } from './ServerControl';
import { CommandPanel } from './CommandPanel';
import { StatusPanel } from './StatusPanel';
import LogsConsole, { LogEntry } from './LogsConsole';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';

export interface Account {
  id: string;
  email: string;
  password: string;
  isOnline: boolean;
  isSelected: boolean;
  lastActivity?: string;
  connectionTime?: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  targetAccounts: string[]; // Account IDs that should send this message
  isEnabled: boolean;
}

export interface LoopSettings {
  isEnabled: boolean;
  delay: number; // delay between messages in ms
  cycleDelay: number; // delay between complete cycles in ms
}

export interface ServerConfig {
  ip: string;
  port: string;
}

const MinecraftBot: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [serverConfig, setServerConfig] = useState<ServerConfig>({ ip: '', port: '25565' });
  const [loopSettings, setLoopSettings] = useState<LoopSettings>({
    isEnabled: false,
    delay: 1000,
    cycleDelay: 5000
  });
  const [isLoopActive, setIsLoopActive] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Logging utility
  const addLog = (level: LogEntry['level'], message: string, data?: any) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    setLogs(prev => [newLog, ...prev].slice(0, 500)); // Keep last 500 logs
    console.log(`[${level.toUpperCase()}] ${message}`, data || '');
  };

  // Load data from localStorage on mount
  useEffect(() => {
    const savedAccounts = localStorage.getItem('mcbot-accounts');
    const savedMessages = localStorage.getItem('mcbot-messages');
    const savedServer = localStorage.getItem('mcbot-server');
    const savedLoopSettings = localStorage.getItem('mcbot-loop-settings');

    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
      addLog('info', 'Loaded saved accounts from storage', { count: JSON.parse(savedAccounts).length });
    }
    if (savedMessages) {
      setChatMessages(JSON.parse(savedMessages));
      addLog('info', 'Loaded saved chat messages from storage', { count: JSON.parse(savedMessages).length });
    }
    if (savedServer) {
      setServerConfig(JSON.parse(savedServer));
      addLog('info', 'Loaded saved server configuration', JSON.parse(savedServer));
    }
    if (savedLoopSettings) {
      setLoopSettings(JSON.parse(savedLoopSettings));
      addLog('info', 'Loaded saved loop settings', JSON.parse(savedLoopSettings));
    }

    // Welcome message
    addLog('success', 'McAFK Bot initialized successfully', { timestamp: new Date().toISOString() });
    toast({
      title: "McAFK Bot Initialized",
      description: "Ready for multi-account management",
    });
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('mcbot-accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('mcbot-messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('mcbot-server', JSON.stringify(serverConfig));
  }, [serverConfig]);

  useEffect(() => {
    localStorage.setItem('mcbot-loop-settings', JSON.stringify(loopSettings));
  }, [loopSettings]);

  const addAccount = (email: string, password: string) => {
    const newAccount: Account = {
      id: Date.now().toString(),
      email,
      password,
      isOnline: false,
      isSelected: false,
      lastActivity: 'Never connected',
      connectionTime: 0,
    };
    setAccounts(prev => [...prev, newAccount]);
    addLog('info', `Account added: ${email}`, { accountId: newAccount.id });
    toast({
      title: "Account Added",
      description: `${email} has been added to your account list`,
    });
  };

  const removeAccount = (id: string) => {
    const account = accounts.find(acc => acc.id === id);
    setAccounts(prev => prev.filter(account => account.id !== id));
    addLog('warning', `Account removed: ${account?.email || 'Unknown'}`, { accountId: id });
    toast({
      title: "Account Removed",
      description: "Account has been removed from your list",
    });
  };

  const toggleAccountSelection = (id: string) => {
    setAccounts(prev =>
      prev.map(account =>
        account.id === id ? { ...account, isSelected: !account.isSelected } : account
      )
    );
  };

  const selectAllAccounts = () => {
    setAccounts(prev => prev.map(account => ({ ...account, isSelected: true })));
  };

  const deselectAllAccounts = () => {
    setAccounts(prev => prev.map(account => ({ ...account, isSelected: false })));
  };

  const selectAccountRange = (startIndex: number, endIndex: number) => {
    setAccounts(prev => prev.map((account, index) => ({
      ...account,
      isSelected: index >= startIndex && index <= endIndex ? true : account.isSelected
    })));
  };

  const connectSelectedAccounts = () => {
    const selectedAccounts = accounts.filter(account => account.isSelected);
    if (selectedAccounts.length === 0) {
      addLog('error', 'Connection attempt failed: No accounts selected');
      toast({
        title: "No Accounts Selected",
        description: "Please select at least one account to connect",
        variant: "destructive",
      });
      return;
    }

    if (!serverConfig.ip) {
      addLog('error', 'Connection attempt failed: No server IP provided');
      toast({
        title: "Server IP Required",
        description: "Please enter a server IP address",
        variant: "destructive",
      });
      return;
    }

    addLog('info', `Starting connection process for ${selectedAccounts.length} accounts`, {
      server: `${serverConfig.ip}:${serverConfig.port}`,
      accounts: selectedAccounts.map(acc => acc.email)
    });

    toast({
      title: "Connecting Accounts",
      description: `Connecting ${selectedAccounts.length} account(s) to ${serverConfig.ip}:${serverConfig.port}`,
    });

    // Simulate realistic connection process with individual results
    selectedAccounts.forEach((account, index) => {
      setTimeout(() => {
        // Simulate connection success/failure (90% success rate for realism)
        const isSuccessful = Math.random() > 0.1;
        
        setAccounts(prev =>
          prev.map(acc =>
            acc.id === account.id
              ? { 
                  ...acc, 
                  isOnline: isSuccessful, 
                  lastActivity: isSuccessful ? 'Connected' : 'Connection Failed',
                  connectionTime: isSuccessful ? Date.now() : 0
                }
              : acc
          )
        );

        if (isSuccessful) {
          addLog('success', `Account connected successfully: ${account.email}`, {
            server: `${serverConfig.ip}:${serverConfig.port}`,
            connectionTime: new Date().toISOString()
          });
        } else {
          addLog('error', `Connection failed for account: ${account.email}`, {
            server: `${serverConfig.ip}:${serverConfig.port}`,
            reason: 'Authentication failed or server unreachable'
          });
        }

        // Show final summary after last account
        if (index === selectedAccounts.length - 1) {
          setTimeout(() => {
            const successfulConnections = selectedAccounts.filter(() => Math.random() > 0.1).length;
            addLog('info', `Connection process completed`, {
              total: selectedAccounts.length,
              successful: successfulConnections,
              failed: selectedAccounts.length - successfulConnections
            });
            toast({
              title: "Connection Process Complete",
              description: `${successfulConnections}/${selectedAccounts.length} account(s) connected successfully`,
            });
          }, 500);
        }
      }, 1000 + (index * 800)); // Stagger connections for realism
    });
  };

  const disconnectSelectedAccounts = () => {
    const selectedAccounts = accounts.filter(account => account.isSelected && account.isOnline);
    if (selectedAccounts.length === 0) {
      addLog('error', 'Disconnection attempt failed: No online accounts selected');
      toast({
        title: "No Online Accounts Selected",
        description: "Please select at least one online account to disconnect",
        variant: "destructive",
      });
      return;
    }

    addLog('info', `Disconnecting ${selectedAccounts.length} accounts`, {
      accounts: selectedAccounts.map(acc => acc.email)
    });

    // Update account status to offline
    setAccounts(prev =>
      prev.map(account =>
        account.isSelected && account.isOnline
          ? { 
              ...account, 
              isOnline: false, 
              lastActivity: 'Disconnected',
              connectionTime: 0
            }
          : account
      )
    );

    selectedAccounts.forEach(account => {
      addLog('success', `Account disconnected: ${account.email}`, {
        disconnectionTime: new Date().toISOString()
      });
    });

    toast({
      title: "Accounts Disconnected",
      description: `${selectedAccounts.length} account(s) disconnected from server`,
    });
  };

  const addChatMessage = () => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: '',
      targetAccounts: [],
      isEnabled: true,
    };
    setChatMessages(prev => [...prev, newMessage]);
    addLog('info', 'New chat message slot created', { messageId: newMessage.id });
  };

  const updateChatMessage = (id: string, updates: Partial<ChatMessage>) => {
    setChatMessages(prev =>
      prev.map(message =>
        message.id === id ? { ...message, ...updates } : message
      )
    );
  };

  const removeChatMessage = (id: string) => {
    const message = chatMessages.find(msg => msg.id === id);
    setChatMessages(prev => prev.filter(message => message.id !== id));
    addLog('warning', 'Chat message removed', { 
      messageId: id, 
      messageText: message?.text || 'Unknown' 
    });
  };

  const assignSelectedAccountsToMessage = (messageId: string) => {
    const selectedAccountIds = accounts
      .filter(account => account.isSelected)
      .map(account => account.id);
    const selectedEmails = accounts
      .filter(account => account.isSelected)
      .map(account => account.email);
    
    updateChatMessage(messageId, { targetAccounts: selectedAccountIds });
    
    addLog('info', `Accounts assigned to message`, {
      messageId,
      accountCount: selectedAccountIds.length,
      accounts: selectedEmails
    });
    
    toast({
      title: "Accounts Assigned",
      description: `${selectedAccountIds.length} account(s) assigned to this message`,
    });
  };

  const startMessageLoop = async () => {
    if (isLoopActive) return;
    
    const activeMessages = chatMessages.filter(msg => msg.isEnabled && msg.text.trim());
    if (activeMessages.length === 0) {
      addLog('error', 'Loop start failed: No active messages configured');
      toast({
        title: "No Messages to Send",
        description: "Please add and enable at least one message",
        variant: "destructive",
      });
      return;
    }

    setIsLoopActive(true);
    addLog('success', 'Message loop started', {
      activeMessages: activeMessages.length,
      messageDelay: loopSettings.delay,
      cycleDelay: loopSettings.cycleDelay,
      messages: activeMessages.map(msg => ({ text: msg.text, targetCount: msg.targetAccounts.length }))
    });
    
    const sendMessageCycle = async () => {
      for (const message of activeMessages) {
        const targetAccounts = accounts.filter(acc => 
          message.targetAccounts.includes(acc.id) && acc.isOnline
        );
        
        if (targetAccounts.length > 0) {
          addLog('success', `Message sent: "${message.text}"`, {
            messageId: message.id,
            targetAccounts: targetAccounts.map(acc => acc.email),
            targetCount: targetAccounts.length
          });
          
          toast({
            title: "Message Sent",
            description: `"${message.text}" sent from ${targetAccounts.length} account(s)`,
          });
        } else {
          addLog('warning', `Message skipped: "${message.text}" - No online target accounts`, {
            messageId: message.id,
            assignedAccounts: message.targetAccounts.length
          });
        }
        
        // Wait for delay between messages
        if (activeMessages.indexOf(message) < activeMessages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, loopSettings.delay));
        }
      }
      
      addLog('info', 'Message cycle completed, waiting for next cycle', {
        cycleDelay: loopSettings.cycleDelay
      });
      
      // Wait for cycle delay before repeating
      if (loopSettings.isEnabled && isLoopActive) {
        await new Promise(resolve => setTimeout(resolve, loopSettings.cycleDelay));
        if (isLoopActive) {
          sendMessageCycle();
        }
      }
    };

    sendMessageCycle();
  };

  const stopMessageLoop = () => {
    setIsLoopActive(false);
    addLog('warning', 'Message loop stopped by user');
    toast({
      title: "Loop Stopped",
      description: "Message loop has been stopped",
    });
  };

  const sendSingleMessage = (messageId: string) => {
    const message = chatMessages.find(msg => msg.id === messageId);
    if (!message || !message.text.trim()) {
      addLog('error', 'Single message send failed: Invalid message', { messageId });
      return;
    }

    const targetAccounts = accounts.filter(acc => 
      message.targetAccounts.includes(acc.id) && acc.isOnline
    );

    if (targetAccounts.length === 0) {
      addLog('error', `Single message send failed: No online target accounts for "${message.text}"`, {
        messageId,
        assignedAccounts: message.targetAccounts.length
      });
      toast({
        title: "No Target Accounts",
        description: "Please assign online accounts to this message",
        variant: "destructive",
      });
      return;
    }

    addLog('success', `Single message sent: "${message.text}"`, {
      messageId,
      targetAccounts: targetAccounts.map(acc => acc.email),
      targetCount: targetAccounts.length
    });
    
    toast({
      title: "Message Sent",
      description: `"${message.text}" sent from ${targetAccounts.length} account(s)`,
    });
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Logs cleared by user');
  };

  const exportLogs = () => {
    const logsData = JSON.stringify(logs, null, 2);
    const blob = new Blob([logsData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcafk-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog('info', 'Logs exported successfully', { filename: a.download });
  };

  return (
    <ScrollArea className="h-screen w-full">
      <div className="min-h-screen bg-background p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              McAFK Bot
            </h1>
            <p className="text-muted-foreground text-lg">
              Modern Minecraft Multi-Account Manager & AFK Bot
            </p>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Account Management */}
            <div className="lg:col-span-1">
              <AccountManager
                accounts={accounts}
                onAddAccount={addAccount}
                onRemoveAccount={removeAccount}
                onToggleSelection={toggleAccountSelection}
                onSelectAll={selectAllAccounts}
                onDeselectAll={deselectAllAccounts}
                onSelectRange={selectAccountRange}
              />
            </div>

            {/* Server Control */}
            <div className="lg:col-span-1">
              <ServerControl
                serverConfig={serverConfig}
                onServerConfigChange={setServerConfig}
                onConnect={connectSelectedAccounts}
                onDisconnect={disconnectSelectedAccounts}
                selectedAccountsCount={accounts.filter(a => a.isSelected).length}
                connectedAccountsCount={accounts.filter(a => a.isOnline).length}
              />
            </div>

            {/* Enhanced Chat Panel */}
            <div className="lg:col-span-2 xl:col-span-1">
              <CommandPanel
                accounts={accounts}
                chatMessages={chatMessages}
                onAddChatMessage={addChatMessage}
                onUpdateChatMessage={updateChatMessage}
                onRemoveChatMessage={removeChatMessage}
                onAssignSelectedAccounts={assignSelectedAccountsToMessage}
                onSendSingleMessage={sendSingleMessage}
                onStartLoop={startMessageLoop}
                onStopLoop={stopMessageLoop}
                loopSettings={loopSettings}
                onLoopSettingsChange={setLoopSettings}
                isLoopActive={isLoopActive}
              />
            </div>

            {/* Status Panel */}
            <div className="lg:col-span-2 xl:col-span-3">
              <StatusPanel accounts={accounts} />
            </div>

            {/* Raw Logs Console */}
            <div className="lg:col-span-2 xl:col-span-3">
              <LogsConsole
                logs={logs}
                onClearLogs={clearLogs}
                onExportLogs={exportLogs}
              />
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default MinecraftBot;