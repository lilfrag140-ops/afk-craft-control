import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Trash2, Users, UserCheck, UserX } from 'lucide-react';
import type { Account } from './MinecraftBot';

interface AccountManagerProps {
  accounts: Account[];
  onAddAccount: (email: string, password: string) => void;
  onRemoveAccount: (id: string) => void;
  onToggleSelection: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectRange: (startIndex: number, endIndex: number) => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({
  accounts,
  onAddAccount,
  onRemoveAccount,
  onToggleSelection,
  onSelectAll,
  onDeselectAll,
  onSelectRange,
}) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');

  const handleAddAccount = () => {
    if (newEmail.trim() && newPassword.trim()) {
      onAddAccount(newEmail.trim(), newPassword.trim());
      setNewEmail('');
      setNewPassword('');
      setIsAddDialogOpen(false);
    }
  };

  const handleSelectRange = () => {
    const start = parseInt(rangeStart) - 1; // Convert to 0-based index
    const end = parseInt(rangeEnd) - 1;
    
    if (start >= 0 && end >= 0 && start <= end && end < accounts.length) {
      onSelectRange(start, end);
      setRangeStart('');
      setRangeEnd('');
    }
  };

  const selectedCount = accounts.filter(account => account.isSelected).length;
  const onlineCount = accounts.filter(account => account.isOnline).length;

  return (
    <Card className="panel-glow h-fit">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-primary">
          <Users className="w-5 h-5" />
          Account Management
        </CardTitle>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span className="status-online">● {onlineCount} Online</span>
          <span>• {selectedCount} Selected</span>
          <span>• {accounts.length} Total</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary Actions */}
          <div className="flex flex-wrap gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="flex-1 min-w-0">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-primary">Add New Account</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="minecraft@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAddAccount}
                      className="flex-1"
                      disabled={!newEmail.trim() || !newPassword.trim()}
                    >
                      Add Account
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Selection Controls */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSelectAll}
              disabled={accounts.length === 0}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Select All
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={onDeselectAll}
              disabled={selectedCount === 0}
            >
              <UserX className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>

          {/* Range Selection */}
          <div className="bg-card-secondary rounded-lg p-3 border border-border space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Select Range</Label>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="From"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="bg-input border-border text-xs h-8"
                  min="1"
                  max={accounts.length.toString()}
                />
              </div>
              <span className="text-muted-foreground text-xs">to</span>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="To"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="bg-input border-border text-xs h-8"
                  min="1"
                  max={accounts.length.toString()}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectRange}
                disabled={!rangeStart || !rangeEnd || accounts.length === 0}
                className="h-8 px-3"
              >
                Select
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Select accounts from position {rangeStart || '?'} to {rangeEnd || '?'}
            </div>
          </div>
        </div>

        {/* Accounts List */}
        <div className="border border-border rounded-lg bg-card-secondary">
          <ScrollArea className="h-80">
            {accounts.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground">
                <div className="text-center">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No accounts added yet</p>
                  <p className="text-sm">Click "Add Account" to get started</p>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {accounts.map((account, index) => (
                  <div
                    key={account.id}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border border-border 
                      bg-background/50 hover:bg-background/80 transition-all duration-200
                      ${account.isSelected ? 'ring-2 ring-primary/50 bg-primary/5' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono min-w-[2rem]">
                        #{index + 1}
                      </span>
                      <Checkbox
                        checked={account.isSelected}
                        onCheckedChange={() => onToggleSelection(account.id)}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">
                          {account.email}
                        </span>
                        <span className={`
                          text-xs px-2 py-0.5 rounded-full font-medium
                          ${account.isOnline ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}
                        `}>
                          {account.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {account.lastActivity || 'Never connected'}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveAccount(account.id)}
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

        {/* Account Summary */}
        {accounts.length > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            {selectedCount > 0 && (
              <span className="text-primary font-medium">
                {selectedCount} account{selectedCount !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};