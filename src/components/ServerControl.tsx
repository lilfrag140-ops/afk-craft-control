import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Server, Wifi, WifiOff, Activity } from 'lucide-react';
import type { ServerConfig } from './MinecraftBot';

interface ServerControlProps {
  serverConfig: ServerConfig;
  onServerConfigChange: (config: ServerConfig) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  selectedAccountsCount: number;
  connectedAccountsCount: number;
}

export const ServerControl: React.FC<ServerControlProps> = ({
  serverConfig,
  onServerConfigChange,
  onConnect,
  onDisconnect,
  selectedAccountsCount,
  connectedAccountsCount,
}) => {
  const handleIpChange = (ip: string) => {
    onServerConfigChange({ ...serverConfig, ip });
  };

  const handlePortChange = (port: string) => {
    onServerConfigChange({ ...serverConfig, port });
  };

  return (
    <Card className="panel-glow h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Server className="w-5 h-5" />
          Server Control
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="w-4 h-4" />
          <span className="status-online">● {connectedAccountsCount} Connected</span>
          <span>• {selectedAccountsCount} Selected</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Server Configuration */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-ip" className="text-foreground font-medium">
              Server IP Address
            </Label>
            <Input
              id="server-ip"
              type="text"
              placeholder="mc.hypixel.net"
              value={serverConfig.ip}
              onChange={(e) => handleIpChange(e.target.value)}
              className="bg-input border-border font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="server-port" className="text-foreground font-medium">
              Port
            </Label>
            <Input
              id="server-port"
              type="number"
              placeholder="25565"
              value={serverConfig.port}
              onChange={(e) => handlePortChange(e.target.value)}
              className="bg-input border-border font-mono"
              min="1"
              max="65535"
            />
          </div>
        </div>

        {/* Server Status Display */}
        <div className="bg-card-secondary rounded-lg p-4 border border-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Target Server:</span>
              <span className="text-sm font-mono text-foreground">
                {serverConfig.ip || 'Not set'}:{serverConfig.port}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Connection Status:</span>
              <span className={`text-sm font-medium ${
                connectedAccountsCount > 0 ? 'text-success' : 'text-muted-foreground'
              }`}>
                {connectedAccountsCount > 0 
                  ? `${connectedAccountsCount} account${connectedAccountsCount !== 1 ? 's' : ''} online`
                  : 'No connections'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Connection Controls */}
        <div className="space-y-3">
          <Button 
            onClick={onConnect}
            disabled={!serverConfig.ip || selectedAccountsCount === 0}
            className="w-full glow-primary"
            size="lg"
          >
            <Wifi className="w-4 h-4 mr-2" />
            Connect Selected Accounts
            {selectedAccountsCount > 0 && (
              <span className="ml-2 bg-primary-dark text-primary-foreground px-2 py-0.5 rounded-full text-xs">
                {selectedAccountsCount}
              </span>
            )}
          </Button>

          <Button 
            onClick={onDisconnect}
            variant="destructive"
            disabled={connectedAccountsCount === 0 || selectedAccountsCount === 0}
            className="w-full"
            size="lg"
          >
            <WifiOff className="w-4 h-4 mr-2" />
            Disconnect Selected Accounts
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Select accounts first, then enter server details</p>
          <p>• Use standard Minecraft server format</p>
          <p>• Default port is 25565 for most servers</p>
        </div>
      </CardContent>
    </Card>
  );
};