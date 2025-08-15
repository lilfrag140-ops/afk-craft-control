import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Plus, Trash2, Send, RotateCcw, Clock } from 'lucide-react';
import type { Command } from './MinecraftBot';

interface CommandPanelProps {
  commands: Command[];
  onAddCommand: () => void;
  onUpdateCommand: (id: string, text: string) => void;
  onRemoveCommand: (id: string) => void;
  onSendCommands: () => void;
  isLooping: boolean;
  onToggleLooping: (looping: boolean) => void;
  commandDelay: number;
  onDelayChange: (delay: number) => void;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({
  commands,
  onAddCommand,
  onUpdateCommand,
  onRemoveCommand,
  onSendCommands,
  isLooping,
  onToggleLooping,
  commandDelay,
  onDelayChange,
}) => {
  const validCommands = commands.filter(cmd => cmd.text.trim());

  return (
    <Card className="panel-glow h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Terminal className="w-5 h-5" />
          Command Panel
        </CardTitle>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>• {validCommands.length} Commands Ready</span>
          {isLooping && <span className="text-warning">• Loop Mode Active</span>}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Command Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={onAddCommand}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Command
          </Button>
          
          <Button 
            onClick={onSendCommands}
            disabled={validCommands.length === 0}
            className="flex-1 glow-primary"
            size="sm"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Commands
          </Button>
        </div>

        {/* Commands List */}
        <div className="border border-border rounded-lg bg-card-secondary">
          <ScrollArea className="h-60">
            {commands.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <div className="text-center">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No commands added yet</p>
                  <p className="text-sm">Click "Add Command" to get started</p>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {commands.map((command, index) => (
                  <div
                    key={command.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50"
                  >
                    <div className="text-xs text-muted-foreground font-mono min-w-[2rem]">
                      #{index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="/say Hello World!"
                        value={command.text}
                        onChange={(e) => onUpdateCommand(command.id, e.target.value)}
                        className="bg-input border-border font-mono text-sm"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveCommand(command.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Command Settings */}
        <div className="space-y-4 bg-card-secondary rounded-lg p-4 border border-border">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="loop-commands"
                checked={isLooping}
                onCheckedChange={onToggleLooping}
              />
              <Label htmlFor="loop-commands" className="flex items-center gap-2 text-foreground">
                <RotateCcw className="w-4 h-4" />
                Loop Commands Continuously
              </Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="command-delay" className="flex items-center gap-2 text-foreground">
                <Clock className="w-4 h-4" />
                Delay Between Commands (ms)
              </Label>
              <Input
                id="command-delay"
                type="number"
                min="100"
                max="60000"
                step="100"
                value={commandDelay}
                onChange={(e) => onDelayChange(parseInt(e.target.value) || 1000)}
                className="bg-input border-border font-mono"
              />
              <div className="text-xs text-muted-foreground">
                Recommended: 1000ms (1 second) to avoid rate limiting
              </div>
            </div>
          </div>
        </div>

        {/* Command Preview */}
        {validCommands.length > 0 && (
          <div className="bg-card-secondary rounded-lg p-3 border border-border">
            <div className="text-xs font-medium text-muted-foreground mb-2">Command Execution Preview:</div>
            <div className="text-xs text-foreground space-y-1 font-mono">
              {validCommands.slice(0, 3).map((cmd, index) => (
                <div key={cmd.id} className="flex items-center gap-2">
                  <span className="text-primary">#{index + 1}</span>
                  <span className="truncate">{cmd.text}</span>
                  <span className="text-muted-foreground ml-auto">
                    +{index * commandDelay}ms
                  </span>
                </div>
              ))}
              {validCommands.length > 3 && (
                <div className="text-muted-foreground">
                  ... and {validCommands.length - 3} more commands
                </div>
              )}
              {isLooping && (
                <div className="text-warning mt-2 flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  Will repeat indefinitely
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Commands are sent in order with specified delay</p>
          <p>• Use standard Minecraft commands (e.g., /say, /msg, /warp)</p>
          <p>• Loop mode will continuously repeat all commands</p>
        </div>
      </CardContent>
    </Card>
  );
};