import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Server, Wifi, WifiOff } from 'lucide-react';

interface StatusHeaderProps {
  connectedCount: number;
  totalCount: number;
  serverConfig: {
    ip: string;
    port: string;
  };
}

export function StatusHeader({ connectedCount, totalCount, serverConfig }: StatusHeaderProps) {
  const isServerConfigured = serverConfig.ip && serverConfig.port;
  const hasConnections = connectedCount > 0;

  return (
    <div className="flex items-center gap-4">
      {/* Account Status */}
      <Card className="bg-card/60 border-border/50">
        <CardContent className="flex items-center gap-2 p-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {connectedCount}/{totalCount}
            </span>
            <Badge 
              variant={hasConnections ? "default" : "secondary"}
              className={hasConnections ? "bg-success text-success-foreground" : ""}
            >
              {hasConnections ? "Online" : "Offline"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Server Status */}
      <Card className="bg-card/60 border-border/50">
        <CardContent className="flex items-center gap-2 p-3">
          <Server className="w-4 h-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate max-w-32">
              {isServerConfigured ? `${serverConfig.ip}:${serverConfig.port}` : "Not configured"}
            </span>
            {isServerConfigured ? (
              <Wifi className="w-3 h-3 text-primary" />
            ) : (
              <WifiOff className="w-3 h-3 text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}