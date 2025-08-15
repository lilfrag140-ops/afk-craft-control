import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Server, MessageSquare, Activity, Play, Square, Settings } from 'lucide-react';

interface Account {
  id: string;
  email: string;
  isOnline: boolean;
  isSelected: boolean;
  lastActivity?: string;
}

interface ServerConfig {
  ip: string;
  port: string;
}

interface DashboardCardsProps {
  accounts: Account[];
  serverConfig: ServerConfig;
  isLoopActive: boolean;
  onQuickConnect?: () => void;
  onQuickDisconnect?: () => void;
  onQuickSettings?: () => void;
}

export function DashboardCards({ 
  accounts, 
  serverConfig, 
  isLoopActive,
  onQuickConnect,
  onQuickDisconnect,
  onQuickSettings
}: DashboardCardsProps) {
  const connectedCount = accounts.filter(acc => acc.isOnline).length;
  const selectedCount = accounts.filter(acc => acc.isSelected).length;
  const totalCount = accounts.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* Accounts Overview */}
      <Card className="bg-gradient-to-br from-card to-card-secondary border-border shadow-card hover:shadow-glow transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Accounts</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{connectedCount}/{totalCount}</div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={connectedCount > 0 ? "default" : "secondary"} className="text-xs">
              {connectedCount > 0 ? "Active" : "Inactive"}
            </Badge>
            <p className="text-xs text-muted-foreground">
              {selectedCount} selected
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Server Status */}
      <Card className="bg-gradient-to-br from-card to-card-secondary border-border shadow-card hover:shadow-glow transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Server</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold text-foreground truncate">
            {serverConfig.ip || "Not set"}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={serverConfig.ip ? "default" : "destructive"} className="text-xs">
              {serverConfig.ip ? "Configured" : "Missing"}
            </Badge>
            <p className="text-xs text-muted-foreground">
              Port: {serverConfig.port || "25565"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Message Loop Status */}
      <Card className="bg-gradient-to-br from-card to-card-secondary border-border shadow-card hover:shadow-glow transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Message Loop</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {isLoopActive ? <Play className="w-6 h-6 text-success" /> : <Square className="w-6 h-6 text-muted-foreground" />}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={isLoopActive ? "default" : "secondary"} className="text-xs">
              {isLoopActive ? "Running" : "Stopped"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-card to-card-secondary border-border shadow-card hover:shadow-glow transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={onQuickConnect}
              disabled={selectedCount === 0 || !serverConfig.ip}
              className="flex-1 text-xs"
            >
              Connect
            </Button>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={onQuickDisconnect}
              disabled={connectedCount === 0}
              className="flex-1 text-xs"
            >
              Disconnect
            </Button>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onQuickSettings}
            className="w-full text-xs"
          >
            <Settings className="w-3 h-3 mr-1" />
            Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}