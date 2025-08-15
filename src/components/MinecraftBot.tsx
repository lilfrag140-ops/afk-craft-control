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
}

export interface Command {
  id: string;
  text: string;
}

export interface ServerConfig {
  ip: string;
  port: string;
}

const MinecraftBot: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [commands, setCommands] = useState<Command[]>([]);
  const [serverConfig, setServerConfig] = useState<ServerConfig>({ ip: '', port: '25565' });
  const [isLooping, setIsLooping] = useState(false);
  const [commandDelay, setCommandDelay] = useState(1000);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedAccounts = localStorage.getItem('mcbot-accounts');
    const savedCommands = localStorage.getItem('mcbot-commands');
    const savedServer = localStorage.getItem('mcbot-server');

    if (savedAccounts) {
      setAccounts(JSON.parse(savedAccounts));
    }
    if (savedCommands) {
      setCommands(JSON.parse(savedCommands));
    }
    if (savedServer) {
      setServerConfig(JSON.parse(savedServer));
    }

    // Welcome message
    toast({
      title: "McAFK Bot Initialized",
      description: "Ready for multi-account management",
    });
  }, []);

  // Save accounts to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('mcbot-accounts', JSON.stringify(accounts));
  }, [accounts]);

  // Save commands to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('mcbot-commands', JSON.stringify(commands));
  }, [commands]);

  // Save server config to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mcbot-server', JSON.stringify(serverConfig));
  }, [serverConfig]);

  const addAccount = (email: string, password: string) => {
    const newAccount: Account = {
      id: Date.now().toString(),
      email,
      password,
      isOnline: false,
      isSelected: false,
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
          ? { ...account, isOnline: true }
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
          ? { ...account, isOnline: false }
          : account
      )
    );

    toast({
      title: "Accounts Disconnected",
      description: `${selectedAccounts.length} account(s) disconnected from server`,
    });
  };

  const addCommand = () => {
    const newCommand: Command = {
      id: Date.now().toString(),
      text: '',
    };
    setCommands(prev => [...prev, newCommand]);
  };

  const updateCommand = (id: string, text: string) => {
    setCommands(prev =>
      prev.map(command =>
        command.id === id ? { ...command, text } : command
      )
    );
  };

  const removeCommand = (id: string) => {
    setCommands(prev => prev.filter(command => command.id !== id));
  };

  const sendCommands = () => {
    const selectedAccounts = accounts.filter(account => account.isSelected && account.isOnline);
    const validCommands = commands.filter(command => command.text.trim());

    if (selectedAccounts.length === 0) {
      toast({
        title: "No Online Accounts Selected",
        description: "Please select at least one connected account",
        variant: "destructive",
      });
      return;
    }

    if (validCommands.length === 0) {
      toast({
        title: "No Commands to Send",
        description: "Please add at least one command",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Sending Commands",
      description: `Sending ${validCommands.length} command(s) from ${selectedAccounts.length} account(s)`,
    });

    // Simulate command sending with delay
    validCommands.forEach((command, index) => {
      setTimeout(() => {
        console.log(`Sending command "${command.text}" from selected accounts`);
        
        if (index === validCommands.length - 1) {
          toast({
            title: "Commands Sent",
            description: `All commands sent successfully${isLooping ? ' (will repeat)' : ''}`,
          });
        }
      }, index * commandDelay);
    });

    // If looping is enabled, schedule the next round
    if (isLooping && validCommands.length > 0) {
      setTimeout(() => {
        sendCommands();
      }, validCommands.length * commandDelay + 2000);
    }
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

          {/* Command Panel */}
          <div className="lg:col-span-2 xl:col-span-1">
            <CommandPanel
              commands={commands}
              onAddCommand={addCommand}
              onUpdateCommand={updateCommand}
              onRemoveCommand={removeCommand}
              onSendCommands={sendCommands}
              isLooping={isLooping}
              onToggleLooping={setIsLooping}
              commandDelay={commandDelay}
              onDelayChange={setCommandDelay}
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