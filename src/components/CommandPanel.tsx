import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Send, 
  RotateCcw, 
  Clock, 
  Users, 
  Play, 
  Square,
  Settings,
  Target,
  Zap
} from 'lucide-react';
import type { Account, ChatMessage, LoopSettings } from './MinecraftBot';

interface CommandPanelProps {
  accounts: Account[];
  chatMessages: ChatMessage[];
  onAddChatMessage: () => void;
  onUpdateChatMessage: (id: string, updates: Partial<ChatMessage>) => void;
  onRemoveChatMessage: (id: string) => void;
  onAssignSelectedAccounts: (messageId: string) => void;
  onSendSingleMessage: (messageId: string) => void;
  onStartLoop: () => void;
  onStopLoop: () => void;
  loopSettings: LoopSettings;
  onLoopSettingsChange: (settings: LoopSettings) => void;
  isLoopActive: boolean;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({
  accounts,
  chatMessages,
  onAddChatMessage,
  onUpdateChatMessage,
  onRemoveChatMessage,
  onAssignSelectedAccounts,
  onSendSingleMessage,
  onStartLoop,
  onStopLoop,
  loopSettings,
  onLoopSettingsChange,
  isLoopActive,
}) => {
  const validMessages = chatMessages.filter(msg => msg.text.trim() && msg.isEnabled);
  const selectedAccountsCount = accounts.filter(acc => acc.isSelected).length;

  const getAccountsForMessage = (messageId: string) => {
    const message = chatMessages.find(msg => msg.id === messageId);
    if (!message) return [];
    
    return accounts.filter(acc => message.targetAccounts.includes(acc.id));
  };

  return (
    <Card className="panel-glow h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-primary">
          <MessageSquare className="w-5 h-5" />
          Advanced Chat Control
        </CardTitle>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>• {validMessages.length} Active Messages</span>
          {isLoopActive && <span className="text-warning">• Loop Running</span>}
          <span>• {selectedAccountsCount} Selected</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={onAddChatMessage}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Message
          </Button>
          
          {isLoopActive ? (
            <Button 
              onClick={onStopLoop}
              variant="destructive"
              size="sm"
              className="flex-1"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Loop
            </Button>
          ) : (
            <Button 
              onClick={onStartLoop}
              disabled={validMessages.length === 0}
              className="flex-1 glow-primary"
              size="sm"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Loop
            </Button>
          )}
        </div>

        {/* Chat Messages List */}
        <div className="border border-border rounded-lg bg-card-secondary">
          <ScrollArea className="h-80">
            {chatMessages.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No messages added yet</p>
                  <p className="text-sm">Click "Add Message" to get started</p>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-3">
                {chatMessages.map((message, index) => {
                  const assignedAccounts = getAccountsForMessage(message.id);
                  const onlineAssigned = assignedAccounts.filter(acc => acc.isOnline);
                  
                  return (
                    <div
                      key={message.id}
                      className={`
                        rounded-lg border border-border bg-background/50 p-4 space-y-3
                        ${message.isEnabled ? 'ring-1 ring-primary/20' : 'opacity-60'}
                      `}
                    >
                      {/* Message Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">
                            Chat #{index + 1}
                          </span>
                          <Switch
                            checked={message.isEnabled}
                            onCheckedChange={(enabled) => 
                              onUpdateChatMessage(message.id, { isEnabled: enabled })
                            }
                            className="scale-75"
                          />
                          <Badge 
                            variant={message.isEnabled ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {message.isEnabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveChatMessage(message.id)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Message Input */}
                      <div className="space-y-2">
                        <Input
                          type="text"
                          placeholder="/msg wonderland hi"
                          value={message.text}
                          onChange={(e) => 
                            onUpdateChatMessage(message.id, { text: e.target.value })
                          }
                          className="bg-input border-border font-mono text-sm"
                        />
                      </div>

                      {/* Account Assignment */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Target Accounts ({onlineAssigned.length}/{assignedAccounts.length})
                          </Label>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onAssignSelectedAccounts(message.id)}
                              disabled={selectedAccountsCount === 0}
                              className="text-xs h-6 px-2"
                            >
                              <Target className="w-3 h-3 mr-1" />
                              Assign Selected
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onSendSingleMessage(message.id)}
                              disabled={onlineAssigned.length === 0 || !message.text.trim()}
                              className="text-xs h-6 px-2"
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              Send Now
                            </Button>
                          </div>
                        </div>
                        
                        {assignedAccounts.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {assignedAccounts.map((account) => (
                              <Badge
                                key={account.id}
                                variant="outline"
                                className={`text-xs ${
                                  account.isOnline 
                                    ? 'border-success text-success' 
                                    : 'border-destructive text-destructive'
                                }`}
                              >
                                {account.email.split('@')[0]}
                                {account.isOnline ? ' ●' : ' ○'}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {assignedAccounts.length === 0 && (
                          <div className="text-xs text-muted-foreground italic">
                            No accounts assigned. Select accounts and click "Assign Selected"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Loop Settings */}
        <div className="bg-card-secondary rounded-lg p-4 border border-border space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <Label className="font-medium text-foreground">Loop Configuration</Label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="message-delay" className="flex items-center gap-2 text-foreground text-sm">
                <Clock className="w-3 h-3" />
                Message Delay (ms)
              </Label>
              <Input
                id="message-delay"
                type="number"
                min="100"
                max="30000"
                step="100"
                value={loopSettings.delay}
                onChange={(e) => onLoopSettingsChange({
                  ...loopSettings,
                  delay: parseInt(e.target.value) || 1000
                })}
                className="bg-input border-border font-mono text-sm"
              />
              <div className="text-xs text-muted-foreground">
                Delay between each message
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cycle-delay" className="flex items-center gap-2 text-foreground text-sm">
                <RotateCcw className="w-3 h-3" />
                Cycle Delay (ms)
              </Label>
              <Input
                id="cycle-delay"
                type="number"
                min="1000"
                max="60000"
                step="1000"
                value={loopSettings.cycleDelay}
                onChange={(e) => onLoopSettingsChange({
                  ...loopSettings,
                  cycleDelay: parseInt(e.target.value) || 5000
                })}
                className="bg-input border-border font-mono text-sm"
              />
              <div className="text-xs text-muted-foreground">
                Delay before repeating all messages
              </div>
            </div>
          </div>
        </div>

        {/* Execution Preview */}
        {validMessages.length > 0 && (
          <div className="bg-card-secondary rounded-lg p-3 border border-border">
            <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Play className="w-3 h-3" />
              Execution Preview:
            </div>
            <div className="text-xs text-foreground space-y-1 font-mono max-h-20 overflow-y-auto">
              {validMessages.slice(0, 3).map((msg, index) => {
                const assignedAccounts = getAccountsForMessage(msg.id);
                const onlineCount = assignedAccounts.filter(acc => acc.isOnline).length;
                
                return (
                  <div key={msg.id} className="flex items-center gap-2">
                    <span className="text-primary">#{index + 1}</span>
                    <span className="truncate flex-1">{msg.text}</span>
                    <span className="text-success text-xs">
                      {onlineCount} accounts
                    </span>
                    <span className="text-muted-foreground">
                      +{index * loopSettings.delay}ms
                    </span>
                  </div>
                );
              })}
              {validMessages.length > 3 && (
                <div className="text-muted-foreground">
                  ... and {validMessages.length - 3} more messages
                </div>
              )}
              <div className="text-warning mt-2 flex items-center gap-1 text-xs">
                <RotateCcw className="w-3 h-3" />
                Cycle repeats every {loopSettings.cycleDelay}ms
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Assign specific accounts to each message for targeted sending</p>
          <p>• Use "Send Now" for one-time messages or "Start Loop" for continuous</p>
          <p>• Each message can have different target accounts</p>
        </div>
      </CardContent>
    </Card>
  );
};