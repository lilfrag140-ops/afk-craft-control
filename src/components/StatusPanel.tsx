import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Circle, User, Clock } from 'lucide-react';
import type { Account } from './MinecraftBot';

interface StatusPanelProps {
  accounts: Account[];
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ accounts }) => {
  const onlineAccounts = accounts.filter(account => account.isOnline);
  const offlineAccounts = accounts.filter(account => !account.isOnline);
  const selectedAccounts = accounts.filter(account => account.isSelected);

  const getStatusIcon = (isOnline: boolean) => {
    return (
      <Circle 
        className={`w-3 h-3 ${isOnline ? 'text-success fill-current' : 'text-destructive fill-current'}`}
      />
    );
  };

  const formatUptime = () => {
    // Simulate uptime for connected accounts
    return "2h 34m";
  };

  return (
    <Card className="panel-glow">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Activity className="w-5 h-5" />
          Real-time Status Dashboard
        </CardTitle>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Circle className="w-3 h-3 text-success fill-current" />
            <span className="text-muted-foreground">
              <span className="text-success font-medium">{onlineAccounts.length}</span> Online
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-3 h-3 text-destructive fill-current" />
            <span className="text-muted-foreground">
              <span className="text-destructive font-medium">{offlineAccounts.length}</span> Offline
            </span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-primary" />
            <span className="text-muted-foreground">
              <span className="text-primary font-medium">{selectedAccounts.length}</span> Selected
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No Accounts to Monitor</p>
            <p className="text-sm">Add accounts to see their real-time status here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card-secondary rounded-lg p-3 border border-border">
                <div className="text-2xl font-bold text-success">{onlineAccounts.length}</div>
                <div className="text-xs text-muted-foreground">Active Connections</div>
              </div>
              <div className="bg-card-secondary rounded-lg p-3 border border-border">
                <div className="text-2xl font-bold text-primary">{selectedAccounts.length}</div>
                <div className="text-xs text-muted-foreground">Selected Accounts</div>
              </div>
              <div className="bg-card-secondary rounded-lg p-3 border border-border">
                <div className="text-2xl font-bold text-foreground">{accounts.length}</div>
                <div className="text-xs text-muted-foreground">Total Accounts</div>
              </div>
              <div className="bg-card-secondary rounded-lg p-3 border border-border">
                <div className="text-2xl font-bold text-warning">
                  {onlineAccounts.length > 0 ? formatUptime() : '--'}
                </div>
                <div className="text-xs text-muted-foreground">Average Uptime</div>
              </div>
            </div>

            {/* Detailed Account Status */}
            <div className="border border-border rounded-lg bg-card-secondary">
              <div className="p-3 border-b border-border">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Account Status Details
                </h3>
              </div>
              
              <ScrollArea className="h-64">
                <div className="p-3 space-y-2">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className={`
                        flex items-center justify-between p-3 rounded-lg border border-border
                        bg-background/50 hover:bg-background/80 transition-all duration-200
                        ${account.isSelected ? 'ring-1 ring-primary/30 bg-primary/5' : ''}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(account.isOnline)}
                        <div>
                          <div className="font-medium text-foreground">
                            {account.email}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>
                              {account.isOnline ? 'Connected' : 'Disconnected'}
                            </span>
                            {account.isOnline && (
                              <>
                                <span>•</span>
                                <Clock className="w-3 h-3" />
                                <span>Uptime: {formatUptime()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {account.isSelected && (
                          <Badge variant="outline" className="text-xs border-primary text-primary">
                            Selected
                          </Badge>
                        )}
                        
                        <Badge 
                          variant={account.isOnline ? "default" : "secondary"} 
                          className={`text-xs ${
                            account.isOnline 
                              ? 'bg-success/20 text-success border-success/30' 
                              : 'bg-destructive/20 text-destructive border-destructive/30'
                          }`}
                        >
                          {account.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Status Legend */}
            <div className="text-xs text-muted-foreground space-y-1 bg-card-secondary rounded-lg p-3 border border-border">
              <div className="font-medium text-foreground mb-2">Status Legend:</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 text-success fill-current" />
                  <span>Online - Account connected to server</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="w-3 h-3 text-destructive fill-current" />
                  <span>Offline - Account disconnected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded border border-primary bg-primary/20"></div>
                  <span>Selected - Will receive commands</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};