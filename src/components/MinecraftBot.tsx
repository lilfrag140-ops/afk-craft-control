import React, { useState, useEffect } from 'react';
import { AccountManager } from './AccountManager';
import { ServerControl } from './ServerControl';
import { CommandPanel } from './CommandPanel';
import { StatusPanel } from './StatusPanel';
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

  // Load data from localStorage on mount
  useEffect(() => {
    const savedAccounts = localStorage.getItem('mcbot-accounts');
    const savedMessages = localStorage.getItem('mcbot-messages');
    const savedServer = localStorage.getItem('mcbot-server');
    const savedLoopSettings = localStorage.getItem('mcbot-loop-settings');

    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    }
    if (savedMessages) {
      setChatMessages(JSON.parse(savedMessages));
    }
    if (savedServer) {
      setServerConfig(JSON.parse(savedServer));
    }
    if (savedLoopSettings) {
      setLoopSettings(JSON.parse(savedLoopSettings));
    }

    // Welcome message
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
    toast({
      title: "Account Added",
      description: `${email} has been added to your account list`,
    });
  };

  const removeAccount = (id: string) => {
    setAccounts(prev => prev.filter(account => account.id !== id));
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
      toast({
        title: "No Accounts Selected",
        description: "Please select at least one account to connect",
        variant: "destructive",
      });
      return;
    }

    if (!serverConfig.ip) {
      toast({
        title: "Server IP Required",
        description: "Please enter a server IP address",
        variant: "destructive",
      });
      return;
    }

    // Update account status to online (simulation)
    setAccounts(prev =>
      prev.map(account =>
        account.isSelected
          ? { 
              ...account, 
              isOnline: true, 
              lastActivity: 'Connected',
              connectionTime: Date.now()
            }
          : account
      )
    );

    toast({
      title: "Connecting Accounts",
      description: `Connecting ${selectedAccounts.length} account(s) to ${serverConfig.ip}:${serverConfig.port}`,
    });

    // Simulate connection process
    setTimeout(() => {
      toast({
        title: "Accounts Connected",
        description: `${selectedAccounts.length} account(s) successfully connected`,
      });
    }, 2000);
  };

  const disconnectSelectedAccounts = () => {
    const selectedAccounts = accounts.filter(account => account.isSelected && account.isOnline);
    if (selectedAccounts.length === 0) {
      toast({
        title: "No Online Accounts Selected",
        description: "Please select at least one online account to disconnect",
        variant: "destructive",
      });
      return;
    }

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
  };

  const updateChatMessage = (id: string, updates: Partial<ChatMessage>) => {
    setChatMessages(prev =>
      prev.map(message =>
        message.id === id ? { ...message, ...updates } : message
      )
    );
  };

  const removeChatMessage = (id: string) => {
    setChatMessages(prev => prev.filter(message => message.id !== id));
  };

  const assignSelectedAccountsToMessage = (messageId: string) => {
    const selectedAccountIds = accounts
      .filter(account => account.isSelected)
      .map(account => account.id);
    
    updateChatMessage(messageId, { targetAccounts: selectedAccountIds });
    
    toast({
      title: "Accounts Assigned",
      description: `${selectedAccountIds.length} account(s) assigned to this message`,
    });
  };

  const startMessageLoop = async () => {
    if (isLoopActive) return;
    
    const activeMessages = chatMessages.filter(msg => msg.isEnabled && msg.text.trim());
    if (activeMessages.length === 0) {
      toast({
        title: "No Messages to Send",
        description: "Please add and enable at least one message",
        variant: "destructive",
      });
      return;
    }

    setIsLoopActive(true);
    
    const sendMessageCycle = async () => {
      for (const message of activeMessages) {
        const targetAccounts = accounts.filter(acc => 
          message.targetAccounts.includes(acc.id) && acc.isOnline
        );
        
        if (targetAccounts.length > 0) {
          console.log(`Sending "${message.text}" from accounts:`, targetAccounts.map(acc => acc.email));
          
          toast({
            title: "Message Sent",
            description: `"${message.text}" sent from ${targetAccounts.length} account(s)`,
          });
        }
        
        // Wait for delay between messages
        if (activeMessages.indexOf(message) < activeMessages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, loopSettings.delay));
        }
      }
      
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
    toast({
      title: "Loop Stopped",
      description: "Message loop has been stopped",
    });
  };

  const sendSingleMessage = (messageId: string) => {
    const message = chatMessages.find(msg => msg.id === messageId);
    if (!message || !message.text.trim()) return;

    const targetAccounts = accounts.filter(acc => 
      message.targetAccounts.includes(acc.id) && acc.isOnline
    );

    if (targetAccounts.length === 0) {
      toast({
        title: "No Target Accounts",
        description: "Please assign online accounts to this message",
        variant: "destructive",
      });
      return;
    }

    console.log(`Sending "${message.text}" from accounts:`, targetAccounts.map(acc => acc.email));
    
    toast({
      title: "Message Sent",
      description: `"${message.text}" sent from ${targetAccounts.length} account(s)`,
    });
  };

  return (
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
        </div>
      </div>
    </div>
  );
};

export default MinecraftBot;