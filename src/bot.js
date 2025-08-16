#!/usr/bin/env node

import { Database } from './database.js';
import { MinecraftBot } from './minecraft-bot.js';
import inquirer from 'inquirer';
import chalk from 'chalk';

class BotManager {
  constructor() {
    this.bots = new Map();
    this.isRunning = false;
    this.messageLoops = new Map();
    this.suppressLogs = false;
  }

  async showMainMenu() {
    this.suppressLogs = true; // Suppress logs during menu interaction
    console.clear();
    console.log(chalk.bold.blue('🎮 Minecraft AFK Bot Manager'));
    console.log(chalk.gray('━'.repeat(50)));

    const accounts = await Database.getAccounts();
    const connectedBots = Array.from(this.bots.values()).filter(bot => bot.isConnected);

    console.log(chalk.cyan(`📊 Status: ${accounts.length} accounts, ${connectedBots.length} connected`));
    console.log('');

    const choices = [
      { name: '🔗 Connect Bot(s)', value: 'connect' },
      { name: '🔇 Silent Connect (Test Mode)', value: 'silent_connect' },
      { name: '💬 Team Chat Only (Test Mode)', value: 'teamchat_only' },
      { name: '🔌 Disconnect All Bots', value: 'disconnect', disabled: connectedBots.length === 0 },
      { name: '🤖 Individual Bot Control', value: 'individual', disabled: connectedBots.length === 0 },
      { name: '🔍 Explore Addon', value: 'addon', disabled: connectedBots.length === 0 },
      { name: '✅ Account Checker', value: 'checker' },
      { name: '💬 Chat Messages', value: 'chat' },
      { name: '🔄 Message Loops', value: 'loops' },
      { name: '👥 Manage Accounts', value: 'accounts' },
      { name: '⚙️ Server Configuration', value: 'server' },
      { name: '📊 View Status', value: 'status' },
      { name: '📋 View Logs', value: 'logs' },
      { name: '🚪 Exit', value: 'exit' }
    ];

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices
      }
    ]);

    this.suppressLogs = false; // Re-enable logs after menu selection

    switch (action) {
      case 'connect':
        await this.connectBots();
        break;
      case 'silent_connect':
        await this.silentConnectBots();
        break;
      case 'teamchat_only':
        await this.teamChatOnlyBots();
        break;
      case 'disconnect':
        await this.disconnectAllBots();
        break;
      case 'individual':
        await this.individualBotControl();
        break;
      case 'addon':
        await this.exploreAddon();
        break;
      case 'checker':
        await this.accountChecker();
        break;
      case 'chat':
        await this.manageChatMessages();
        break;
      case 'loops':
        await this.manageMessageLoops();
        break;
      case 'accounts':
        await this.manageAccounts();
        break;
      case 'server':
        await this.configureServer();
        break;
      case 'status':
        await this.showStatus();
        break;
      case 'logs':
        await this.viewLogs();
        break;
      case 'exit':
        await this.cleanup();
        process.exit(0);
    }
  }

  async connectBots() {
    const accounts = await Database.getAccounts();
    
    if (accounts.length === 0) {
      console.log(chalk.yellow('⚠️ No accounts found. Please add an account first.'));
      await this.waitForKeypress();
      return;
    }

    const serverConfig = await Database.getServerConfig();
    
    console.log(chalk.blue(`🌐 Server: ${serverConfig.server_ip}:${serverConfig.server_port}`));
    
    const choices = accounts.map(account => ({
      name: `${account.email} ${account.is_connected ? chalk.green('(Connected)') : chalk.red('(Disconnected)')}`,
      value: account.email,
      disabled: this.bots.has(account.email) && this.bots.get(account.email).isConnected
    }));

    const { selectedAccounts } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedAccounts',
        message: 'Select accounts to connect:',
        choices,
        validate: (input) => input.length > 0 || 'Please select at least one account'
      }
    ]);

    console.log(chalk.blue(`🚀 Connecting ${selectedAccounts.length} account(s)...`));

    for (const email of selectedAccounts) {
      try {
        const account = accounts.find(acc => acc.email === email);
        console.log(chalk.blue(`\n🔄 Connecting ${email}...`));
        
        const bot = new MinecraftBot(
          account.email,
          account.password,
          serverConfig.server_ip,
          serverConfig.server_port
        );

        await bot.connect();
        await bot.startAFKSequence();
        
        this.bots.set(email, bot);
        console.log(chalk.green(`✅ ${email} connected and AFK sequence started!`));
        
      } catch (error) {
        console.error(chalk.red(`❌ Failed to connect ${email}: ${error.message}`));
      }
    }

    console.log(chalk.green(`\n🎉 Connection process completed!`));
    await this.waitForKeypress();
  }

  async silentConnectBots() {
    const accounts = await Database.getAccounts();
    
    if (accounts.length === 0) {
      console.log(chalk.yellow('⚠️ No accounts found. Please add an account first.'));
      await this.waitForKeypress();
      return;
    }

    const serverConfig = await Database.getServerConfig();
    
    console.log(chalk.blue(`🌐 Server: ${serverConfig.server_ip}:${serverConfig.server_port}`));
    console.log(chalk.yellow('🔇 Silent Connect Mode - No commands or chat will be sent'));
    
    const choices = accounts.map(account => ({
      name: `${account.email} ${account.is_connected ? chalk.green('(Connected)') : chalk.red('(Disconnected)')}`,
      value: account.email,
      disabled: this.bots.has(account.email) && this.bots.get(account.email).isConnected
    }));

    const { selectedAccounts } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedAccounts',
        message: 'Select accounts to silently connect:',
        choices,
        validate: (input) => input.length > 0 || 'Please select at least one account'
      }
    ]);

    console.log(chalk.blue(`🚀 Silently connecting ${selectedAccounts.length} account(s)...`));

    for (const email of selectedAccounts) {
      try {
        const account = accounts.find(acc => acc.email === email);
        console.log(chalk.blue(`\n🔄 Connecting ${email}...`));
        
        const bot = new MinecraftBot(
          account.email,
          account.password,
          serverConfig.server_ip,
          serverConfig.server_port
        );

        // Set silent mode flag before connecting
        bot.silentMode = true;
        
        await bot.connect();
        // Note: NOT calling startAFKSequence() for silent mode
        
        this.bots.set(email, bot);
        console.log(chalk.green(`✅ ${email} connected silently (no commands sent)!`));
        
      } catch (error) {
        console.error(chalk.red(`❌ Failed to connect ${email}: ${error.message}`));
      }
    }

    console.log(chalk.green(`\n🎉 Silent connection process completed!`));
    console.log(chalk.yellow('📊 Bots are connected but idle - no chat messages or commands sent'));
    await this.waitForKeypress();
  }

  async teamChatOnlyBots() {
    const accounts = await Database.getAccounts();
    
    if (accounts.length === 0) {
      console.log(chalk.yellow('⚠️ No accounts found. Please add an account first.'));
      await this.waitForKeypress();
      return;
    }

    const serverConfig = await Database.getServerConfig();
    
    console.log(chalk.blue(`🌐 Server: ${serverConfig.server_ip}:${serverConfig.server_port}`));
    console.log(chalk.yellow('💬 Team Chat Only Mode - Only /team chat will be sent after 3 seconds'));
    
    const choices = accounts.map(account => ({
      name: `${account.email} ${account.is_connected ? chalk.green('(Connected)') : chalk.red('(Disconnected)')}`,
      value: account.email,
      disabled: this.bots.has(account.email) && this.bots.get(account.email).isConnected
    }));

    const { selectedAccounts } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedAccounts',
        message: 'Select accounts for team chat only mode:',
        choices,
        validate: (input) => input.length > 0 || 'Please select at least one account'
      }
    ]);

    console.log(chalk.blue(`🚀 Connecting ${selectedAccounts.length} account(s) in team chat only mode...`));

    for (const email of selectedAccounts) {
      try {
        const account = accounts.find(acc => acc.email === email);
        console.log(chalk.blue(`\n🔄 Connecting ${email}...`));
        
        const bot = new MinecraftBot(
          account.email,
          account.password,
          serverConfig.server_ip,
          serverConfig.server_port
        );

        // Set team chat only mode flag before connecting
        bot.teamChatOnly = true;
        
        await bot.connect();
        // Note: NOT calling startAFKSequence() for team chat only mode
        
        this.bots.set(email, bot);
        console.log(chalk.green(`✅ ${email} connected in team chat only mode!`));
        
      } catch (error) {
        console.error(chalk.red(`❌ Failed to connect ${email}: ${error.message}`));
      }
    }

    console.log(chalk.green(`\n🎉 Team chat only connection process completed!`));
    console.log(chalk.yellow('📊 Bots will send /team chat after 3 seconds and then stay idle'));
    await this.waitForKeypress();
  }

  async disconnectAllBots() {
    console.log(chalk.yellow('🔌 Disconnecting all bots...'));
    
    for (const [email, bot] of this.bots.entries()) {
      try {
        bot.disconnect();
        await Database.updateAccountStatus(email, 'disconnected', false);
        console.log(chalk.yellow(`✅ ${email} disconnected`));
      } catch (error) {
        console.error(chalk.red(`❌ Error disconnecting ${email}: ${error.message}`));
      }
    }
    
    this.bots.clear();
    console.log(chalk.green('🎉 All bots disconnected!'));
    await this.waitForKeypress();
  }

  async manageAccounts() {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Account Management:',
        choices: [
          { name: '➕ Add Single Account', value: 'add' },
          { name: '📁 Load Accounts from File', value: 'loadFile' },
          { name: '📋 List Accounts', value: 'list' },
          { name: '🗑️ Remove Account', value: 'remove' },
          { name: '🔙 Back to Main Menu', value: 'back' }
        ]
      }
    ]);

    switch (action) {
      case 'add':
        await this.addAccount();
        break;
      case 'loadFile':
        await this.loadAccountsFromFile();
        break;
      case 'list':
        await this.listAccounts();
        break;
      case 'remove':
        await this.removeAccount();
        break;
      case 'back':
        return;
    }
  }

  async addAccount() {
    console.log(chalk.blue('➕ Add New Minecraft Account'));
    console.log(chalk.gray('Enter your Microsoft account credentials:'));

    const { email, password } = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'Email:',
        validate: (input) => input.includes('@') || 'Please enter a valid email address'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*',
        validate: (input) => input.length > 0 || 'Password cannot be empty'
      }
    ]);

    try {
      await Database.addAccount(email, password);
      console.log(chalk.green(`✅ Account ${email} added successfully!`));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to add account: ${error.message}`));
    }

    await this.waitForKeypress();
  }

  async loadAccountsFromFile() {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const filePath = 'accounts.txt';
      
      if (!fs.existsSync(filePath)) {
        console.log(chalk.yellow('⚠️ accounts.txt file not found!'));
        console.log(chalk.gray('Please create an accounts.txt file with the format:'));
        console.log(chalk.gray('email:password'));
        console.log(chalk.gray('email2:password2'));
        console.log(chalk.gray('...'));
        await this.waitForKeypress();
        return;
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.split('\n').filter(line => line.trim().length > 0);
      
      if (lines.length === 0) {
        console.log(chalk.yellow('⚠️ accounts.txt is empty!'));
        await this.waitForKeypress();
        return;
      }

      console.log(chalk.blue(`📁 Found ${lines.length} accounts in file`));
      
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Load ${lines.length} accounts from accounts.txt?`,
          default: true
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('❌ Operation cancelled.'));
        await this.waitForKeypress();
        return;
      }

      let successCount = 0;
      let failCount = 0;

      console.log(chalk.blue('🔄 Processing accounts...'));

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line.includes(':')) {
          console.log(chalk.red(`❌ Line ${i + 1}: Invalid format - missing ':' separator`));
          failCount++;
          continue;
        }

        const [email, password] = line.split(':');
        
        if (!email || !password) {
          console.log(chalk.red(`❌ Line ${i + 1}: Invalid format - missing email or password`));
          failCount++;
          continue;
        }

        if (!email.includes('@')) {
          console.log(chalk.red(`❌ Line ${i + 1}: Invalid email format - ${email}`));
          failCount++;
          continue;
        }

        try {
          await Database.addAccount(email.trim(), password.trim());
          console.log(chalk.green(`✅ Added: ${email.trim()}`));
          successCount++;
        } catch (error) {
          console.log(chalk.red(`❌ Failed to add ${email.trim()}: ${error.message}`));
          failCount++;
        }
      }

      console.log('');
      console.log(chalk.blue('📊 Import Summary:'));
      console.log(`✅ Successfully added: ${chalk.green(successCount)} accounts`);
      console.log(`❌ Failed: ${chalk.red(failCount)} accounts`);
      console.log(`📁 Total processed: ${chalk.cyan(lines.length)} lines`);

    } catch (error) {
      console.error(chalk.red(`❌ Failed to load accounts from file: ${error.message}`));
    }

    await this.waitForKeypress();
  }

  async removeAccount() {
    const accounts = await Database.getAccounts();
    
    if (accounts.length === 0) {
      console.log(chalk.yellow('⚠️ No accounts found.'));
      await this.waitForKeypress();
      return;
    }

    const choices = accounts.map(account => ({
      name: `${account.email} ${account.is_connected ? chalk.green('(Connected)') : chalk.red('(Disconnected)')}`,
      value: account.email
    }));

    choices.push({ name: '🔙 Cancel', value: 'cancel' });

    const { selectedAccount } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedAccount',
        message: 'Select account to remove:',
        choices
      }
    ]);

    if (selectedAccount === 'cancel') return;

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to remove ${selectedAccount}?`,
        default: false
      }
    ]);

    if (confirm) {
      try {
        // Disconnect bot if connected
        if (this.bots.has(selectedAccount)) {
          this.bots.get(selectedAccount).disconnect();
          this.bots.delete(selectedAccount);
        }

        await Database.supabase
          .from('accounts')
          .delete()
          .eq('email', selectedAccount);

        console.log(chalk.green(`✅ Account ${selectedAccount} removed successfully!`));
      } catch (error) {
        console.error(chalk.red(`❌ Failed to remove account: ${error.message}`));
      }
    } else {
      console.log(chalk.yellow('❌ Operation cancelled.'));
    }

    await this.waitForKeypress();
  }

  async listAccounts() {
    const accounts = await Database.getAccounts();
    
    if (accounts.length === 0) {
      console.log(chalk.yellow('📭 No accounts found.'));
    } else {
      console.log(chalk.blue('📋 Accounts:'));
      console.log(chalk.gray('━'.repeat(50)));
      
      accounts.forEach((account, index) => {
        const status = account.is_connected ? chalk.green('Connected') : chalk.red('Disconnected');
        const lastConnected = account.last_connected_at 
          ? new Date(account.last_connected_at).toLocaleString()
          : 'Never';
        
        console.log(`${index + 1}. ${chalk.cyan(account.email)}`);
        console.log(`   Status: ${status}`);
        console.log(`   Last Connected: ${chalk.gray(lastConnected)}`);
        console.log('');
      });
    }

    await this.waitForKeypress();
  }

  async showStatus() {
    const accounts = await Database.getAccounts();
    const connectedBots = Array.from(this.bots.values()).filter(bot => bot.isConnected);
    const serverConfig = await Database.getServerConfig();

    console.log(chalk.blue('📊 Bot Manager Status'));
    console.log(chalk.gray('━'.repeat(50)));
    console.log(`🎮 Server: ${chalk.cyan(serverConfig.server_ip + ':' + serverConfig.server_port)}`);
    console.log(`👥 Total Accounts: ${chalk.cyan(accounts.length)}`);
    console.log(`🔗 Connected Bots: ${chalk.green(connectedBots.length)}`);
    console.log('');

    if (connectedBots.length > 0) {
      console.log(chalk.green('🤖 Active Bots:'));
      connectedBots.forEach(bot => {
        console.log(`  • ${chalk.cyan(bot.email)} - ${chalk.green('AFK Mode Active')}`);
      });
    }

    await this.waitForKeypress();
  }

  async waitForKeypress() {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press Enter to continue...'
      }
    ]);
  }

  async individualBotControl() {
    const connectedBots = Array.from(this.bots.values()).filter(bot => bot.isConnected);
    
    const choices = connectedBots.map(bot => ({
      name: `${bot.email} - ${chalk.green('Connected')}`,
      value: bot.email
    }));

    choices.push({ name: '🔙 Back to Main Menu', value: 'back' });

    const { selectedBot } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedBot',
        message: 'Select a bot to control:',
        choices
      }
    ]);

    if (selectedBot === 'back') return;

    await this.controlIndividualBot(selectedBot);
  }

  async controlIndividualBot(email) {
    const bot = this.bots.get(email);
    if (!bot) return;

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: `Control ${email}:`,
        choices: [
          { name: '💬 Send Chat Message', value: 'chat' },
          { name: '🔌 Disconnect', value: 'disconnect' },
          { name: '📊 Show Info', value: 'info' },
          { name: '🔙 Back', value: 'back' }
        ]
      }
    ]);

    switch (action) {
      case 'chat':
        await this.sendBotMessage(email);
        break;
      case 'disconnect':
        await this.disconnectSingleBot(email);
        break;
      case 'info':
        await this.showBotInfo(email);
        break;
      case 'back':
        return;
    }
  }

  async sendBotMessage(email) {
    const { message } = await inquirer.prompt([
      {
        type: 'input',
        name: 'message',
        message: 'Enter message to send:',
        validate: (input) => input.length > 0 || 'Message cannot be empty'
      }
    ]);

    const bot = this.bots.get(email);
    if (bot && bot.bot) {
      try {
        bot.bot.chat(message);
        console.log(chalk.green(`✅ Message sent from ${email}: ${message}`));
        await Database.logEvent(email, 'INFO', `Sent message: ${message}`);
      } catch (error) {
        console.error(chalk.red(`❌ Failed to send message: ${error.message}`));
      }
    }

    await this.waitForKeypress();
  }

  async disconnectSingleBot(email) {
    const bot = this.bots.get(email);
    if (bot) {
      try {
        bot.disconnect();
        this.bots.delete(email);
        await Database.updateAccountStatus(email, 'disconnected', false);
        console.log(chalk.yellow(`✅ ${email} disconnected`));
      } catch (error) {
        console.error(chalk.red(`❌ Error disconnecting ${email}: ${error.message}`));
      }
    }

    await this.waitForKeypress();
  }

  async showBotInfo(email) {
    const bot = this.bots.get(email);
    if (bot && bot.bot) {
      console.log(chalk.blue(`📊 Bot Info: ${email}`));
      console.log(chalk.gray('━'.repeat(50)));
      console.log(`Health: ${chalk.green(bot.bot.health || 'Unknown')}`);
      console.log(`Food: ${chalk.yellow(bot.bot.food || 'Unknown')}`);
      console.log(`Position: ${bot.bot.entity?.position ? 
        `x=${bot.bot.entity.position.x.toFixed(2)}, y=${bot.bot.entity.position.y.toFixed(2)}, z=${bot.bot.entity.position.z.toFixed(2)}` : 
        'Unknown'}`);
      console.log(`Experience: ${chalk.cyan(bot.bot.experience?.level || 'Unknown')}`);
    }

    await this.waitForKeypress();
  }

  async manageChatMessages() {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Chat Message Management:',
        choices: [
          { name: '➕ Add Chat Message', value: 'add' },
          { name: '📋 List Messages', value: 'list' },
          { name: '✏️ Edit Message', value: 'edit' },
          { name: '🗑️ Delete Message', value: 'delete' },
          { name: '📤 Send Message to Selected Bots', value: 'send' },
          { name: '🔙 Back to Main Menu', value: 'back' }
        ]
      }
    ]);

    switch (action) {
      case 'add':
        await this.addChatMessage();
        break;
      case 'list':
        await this.listChatMessages();
        break;
      case 'edit':
        await this.editChatMessage();
        break;
      case 'delete':
        await this.deleteChatMessage();
        break;
      case 'send':
        await this.sendMessageToSelectedBots();
        break;
      case 'back':
        return;
    }
  }

  async addChatMessage() {
    const { message, interval } = await inquirer.prompt([
      {
        type: 'input',
        name: 'message',
        message: 'Enter chat message:',
        validate: (input) => input.length > 0 || 'Message cannot be empty'
      },
      {
        type: 'number',
        name: 'interval',
        message: 'Interval in seconds (for loops):',
        default: 60,
        validate: (input) => input > 0 || 'Interval must be greater than 0'
      }
    ]);

    try {
      const result = await Database.supabase
        .from('chat_messages')
        .insert([{ message, interval_seconds: interval }])
        .select()
        .single();

      console.log(chalk.green(`✅ Chat message added successfully!`));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to add message: ${error.message}`));
    }

    await this.waitForKeypress();
  }

  async listChatMessages() {
    try {
      const { data: messages } = await Database.supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!messages || messages.length === 0) {
        console.log(chalk.yellow('📭 No chat messages found.'));
      } else {
        console.log(chalk.blue('💬 Chat Messages:'));
        console.log(chalk.gray('━'.repeat(50)));
        
        messages.forEach((msg, index) => {
          const status = msg.is_enabled ? chalk.green('Enabled') : chalk.red('Disabled');
          console.log(`${index + 1}. ${chalk.cyan(msg.message)}`);
          console.log(`   Interval: ${chalk.yellow(msg.interval_seconds)}s | Status: ${status}`);
          console.log('');
        });
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to load messages: ${error.message}`));
    }

    await this.waitForKeypress();
  }

  async sendMessageToSelectedBots() {
    const connectedBots = Array.from(this.bots.values()).filter(bot => bot.isConnected);
    
    if (connectedBots.length === 0) {
      console.log(chalk.yellow('⚠️ No connected bots found.'));
      await this.waitForKeypress();
      return;
    }

    const { message } = await inquirer.prompt([
      {
        type: 'input',
        name: 'message',
        message: 'Enter message to send:',
        validate: (input) => input.length > 0 || 'Message cannot be empty'
      }
    ]);

    const choices = connectedBots.map(bot => ({
      name: bot.email,
      value: bot.email
    }));

    const { selectedBots } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedBots',
        message: 'Select bots to send message to:',
        choices,
        validate: (input) => input.length > 0 || 'Please select at least one bot'
      }
    ]);

    for (const email of selectedBots) {
      const bot = this.bots.get(email);
      if (bot && bot.bot) {
        try {
          bot.bot.chat(message);
          console.log(chalk.green(`✅ Message sent from ${email}`));
          await Database.logEvent(email, 'INFO', `Sent message: ${message}`);
        } catch (error) {
          console.error(chalk.red(`❌ Failed to send from ${email}: ${error.message}`));
        }
      }
    }

    await this.waitForKeypress();
  }

  async manageMessageLoops() {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Message Loop Management:',
        choices: [
          { name: '▶️ Start Message Loop', value: 'start' },
          { name: '⏹️ Stop Message Loop', value: 'stop' },
          { name: '📊 Loop Status', value: 'status' },
          { name: '🔙 Back to Main Menu', value: 'back' }
        ]
      }
    ]);

    switch (action) {
      case 'start':
        await this.startMessageLoop();
        break;
      case 'stop':
        await this.stopMessageLoop();
        break;
      case 'status':
        await this.showLoopStatus();
        break;
      case 'back':
        return;
    }
  }

  async startMessageLoop() {
    try {
      const { data: messages } = await Database.supabase
        .from('chat_messages')
        .select('*')
        .eq('is_enabled', true);

      if (!messages || messages.length === 0) {
        console.log(chalk.yellow('⚠️ No enabled chat messages found. Add some messages first.'));
        await this.waitForKeypress();
        return;
      }

      const connectedBots = Array.from(this.bots.values()).filter(bot => bot.isConnected);
      
      if (connectedBots.length === 0) {
        console.log(chalk.yellow('⚠️ No connected bots found.'));
        await this.waitForKeypress();
        return;
      }

      // Stop existing loops
      this.stopAllLoops();

      messages.forEach(msg => {
        const interval = setInterval(() => {
          connectedBots.forEach(async (bot) => {
            if (bot.bot && bot.isConnected) {
              try {
                bot.bot.chat(msg.message);
                await Database.logEvent(bot.email, 'INFO', `Loop message sent: ${msg.message}`);
              } catch (error) {
                console.error(chalk.red(`❌ Loop message failed for ${bot.email}: ${error.message}`));
              }
            }
          });
        }, msg.interval_seconds * 1000);

        this.messageLoops.set(msg.id, interval);
      });

      console.log(chalk.green(`✅ Started message loops for ${messages.length} messages`));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to start loops: ${error.message}`));
    }

    await this.waitForKeypress();
  }

  async stopMessageLoop() {
    this.stopAllLoops();
    console.log(chalk.yellow('⏹️ All message loops stopped'));
    await this.waitForKeypress();
  }

  stopAllLoops() {
    this.messageLoops.forEach(interval => clearInterval(interval));
    this.messageLoops.clear();
  }

  async showLoopStatus() {
    console.log(chalk.blue('🔄 Message Loop Status'));
    console.log(chalk.gray('━'.repeat(50)));
    console.log(`Active Loops: ${chalk.cyan(this.messageLoops.size)}`);
    
    if (this.messageLoops.size > 0) {
      console.log(chalk.green('✅ Message loops are running'));
    } else {
      console.log(chalk.yellow('⏹️ No active message loops'));
    }

    await this.waitForKeypress();
  }

  async configureServer() {
    const currentConfig = await Database.getServerConfig();
    
    console.log(chalk.blue('⚙️ Current Server Configuration:'));
    console.log(`IP: ${chalk.cyan(currentConfig.server_ip)}`);
    console.log(`Port: ${chalk.cyan(currentConfig.server_port)}`);
    console.log('');

    const { newIp, newPort } = await inquirer.prompt([
      {
        type: 'input',
        name: 'newIp',
        message: 'Server IP:',
        default: currentConfig.server_ip,
        validate: (input) => input.length > 0 || 'IP cannot be empty'
      },
      {
        type: 'number',
        name: 'newPort',
        message: 'Server Port:',
        default: currentConfig.server_port,
        validate: (input) => input > 0 && input <= 65535 || 'Port must be between 1 and 65535'
      }
    ]);

    try {
      await Database.updateServerConfig(newIp, newPort);
      console.log(chalk.green('✅ Server configuration updated successfully!'));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to update configuration: ${error.message}`));
    }

    await this.waitForKeypress();
  }

  async viewLogs() {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Log Management:',
        choices: [
          { name: '📋 View Recent Logs', value: 'recent' },
          { name: '🔍 Filter Logs by Account', value: 'filter' },
          { name: '🗑️ Clear All Logs', value: 'clear' },
          { name: '📁 Export Logs', value: 'export' },
          { name: '🔙 Back to Main Menu', value: 'back' }
        ]
      }
    ]);

    switch (action) {
      case 'recent':
        await this.showRecentLogs();
        break;
      case 'filter':
        await this.filterLogsByAccount();
        break;
      case 'clear':
        await this.clearLogs();
        break;
      case 'export':
        await this.exportLogs();
        break;
      case 'back':
        return;
    }
  }

  async showRecentLogs() {
    try {
      const { data: logs } = await Database.supabase
        .from('bot_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (!logs || logs.length === 0) {
        console.log(chalk.yellow('📭 No logs found.'));
      } else {
        console.log(chalk.blue('📋 Recent Logs (Last 50):'));
        console.log(chalk.gray('━'.repeat(80)));
        
        logs.forEach(log => {
          const levelColor = log.log_level === 'ERROR' ? chalk.red : 
                            log.log_level === 'SUCCESS' ? chalk.green : 
                            chalk.cyan;
          
          const time = new Date(log.timestamp).toLocaleString();
          console.log(`${chalk.gray(time)} | ${levelColor(log.log_level)} | ${chalk.yellow(log.account_email)}`);
          console.log(`  ${log.message}`);
          console.log('');
        });
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to load logs: ${error.message}`));
    }

    await this.waitForKeypress();
  }

  async filterLogsByAccount() {
    const accounts = await Database.getAccounts();
    
    if (accounts.length === 0) {
      console.log(chalk.yellow('⚠️ No accounts found.'));
      await this.waitForKeypress();
      return;
    }

    const choices = accounts.map(account => ({
      name: account.email,
      value: account.email
    }));

    const { selectedAccount } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedAccount',
        message: 'Select account to view logs:',
        choices
      }
    ]);

    try {
      const { data: logs } = await Database.supabase
        .from('bot_logs')
        .select('*')
        .eq('account_email', selectedAccount)
        .order('timestamp', { ascending: false })
        .limit(30);

      if (!logs || logs.length === 0) {
        console.log(chalk.yellow(`📭 No logs found for ${selectedAccount}.`));
      } else {
        console.log(chalk.blue(`📋 Logs for ${selectedAccount}:`));
        console.log(chalk.gray('━'.repeat(80)));
        
        logs.forEach(log => {
          const levelColor = log.log_level === 'ERROR' ? chalk.red : 
                            log.log_level === 'SUCCESS' ? chalk.green : 
                            chalk.cyan;
          
          const time = new Date(log.timestamp).toLocaleString();
          console.log(`${chalk.gray(time)} | ${levelColor(log.log_level)}`);
          console.log(`  ${log.message}`);
          console.log('');
        });
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to load logs: ${error.message}`));
    }

    await this.waitForKeypress();
  }

  async clearLogs() {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to clear all logs? This cannot be undone.',
        default: false
      }
    ]);

    if (confirm) {
      try {
        await Database.supabase
          .from('bot_logs')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        console.log(chalk.green('✅ All logs cleared successfully!'));
      } catch (error) {
        console.error(chalk.red(`❌ Failed to clear logs: ${error.message}`));
      }
    } else {
      console.log(chalk.yellow('❌ Operation cancelled.'));
    }

    await this.waitForKeypress();
  }

  async exportLogs() {
    try {
      const { data: logs } = await Database.supabase
        .from('bot_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (!logs || logs.length === 0) {
        console.log(chalk.yellow('📭 No logs to export.'));
        await this.waitForKeypress();
        return;
      }

      const fs = await import('fs');
      const filename = `bot-logs-${new Date().toISOString().slice(0, 10)}.json`;
      
      fs.writeFileSync(filename, JSON.stringify(logs, null, 2));
      console.log(chalk.green(`✅ Logs exported to ${filename}`));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to export logs: ${error.message}`));
    }

    await this.waitForKeypress();
  }

  async editChatMessage() {
    try {
      const { data: messages } = await Database.supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!messages || messages.length === 0) {
        console.log(chalk.yellow('📭 No messages found.'));
        await this.waitForKeypress();
        return;
      }

      const choices = messages.map(msg => ({
        name: `${msg.message} (${msg.interval_seconds}s)`,
        value: msg.id
      }));

      const { selectedMessage } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedMessage',
          message: 'Select message to edit:',
          choices
        }
      ]);

      const message = messages.find(m => m.id === selectedMessage);
      
      const { newMessage, newInterval, enabled } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newMessage',
          message: 'New message:',
          default: message.message
        },
        {
          type: 'number',
          name: 'newInterval',
          message: 'New interval (seconds):',
          default: message.interval_seconds
        },
        {
          type: 'confirm',
          name: 'enabled',
          message: 'Enabled:',
          default: message.is_enabled
        }
      ]);

      await Database.supabase
        .from('chat_messages')
        .update({ 
          message: newMessage, 
          interval_seconds: newInterval,
          is_enabled: enabled
        })
        .eq('id', selectedMessage);

      console.log(chalk.green('✅ Message updated successfully!'));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to edit message: ${error.message}`));
    }

    await this.waitForKeypress();
  }

  async deleteChatMessage() {
    try {
      const { data: messages } = await Database.supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!messages || messages.length === 0) {
        console.log(chalk.yellow('📭 No messages found.'));
        await this.waitForKeypress();
        return;
      }

      const choices = messages.map(msg => ({
        name: `${msg.message} (${msg.interval_seconds}s)`,
        value: msg.id
      }));

      const { selectedMessage } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedMessage',
          message: 'Select message to delete:',
          choices
        }
      ]);

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to delete this message?',
          default: false
        }
      ]);

      if (confirm) {
        await Database.supabase
          .from('chat_messages')
          .delete()
          .eq('id', selectedMessage);

        console.log(chalk.green('✅ Message deleted successfully!'));
      } else {
        console.log(chalk.yellow('❌ Operation cancelled.'));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Failed to delete message: ${error.message}`));
    }

    await this.waitForKeypress();
  }

  async exploreAddon() {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Explore Addon:',
        choices: [
          { name: '🔍 Player Discovery & Mass Command', value: 'massCommand' },
          { name: '🤖 Team Join Auto-Messaging', value: 'teamJoin' },
          { name: '🔄 Command Looping', value: 'looping' },
          { name: '📊 Addon Status', value: 'status' },
          { name: '🔙 Back to Main Menu', value: 'back' }
        ]
      }
    ]);

    switch (action) {
      case 'massCommand':
        await this.massCommand();
        break;
      case 'teamJoin':
        await this.teamJoinMessaging();
        break;
      case 'looping':
        await this.commandLooping();
        break;
      case 'status':
        await this.addonStatus();
        break;
      case 'back':
        return;
    }
  }

  async massCommand() {
    const connectedBots = Array.from(this.bots.values()).filter(bot => bot.isConnected);
    
    if (connectedBots.length === 0) {
      console.log(chalk.yellow('⚠️ No connected bots found.'));
      await this.waitForKeypress();
      return;
    }

    console.log(chalk.blue('🔍 Player Discovery & Mass Command'));
    console.log(chalk.gray('This will discover online players and send them messages.'));
    console.log('');

    const { 
      commandFormat, 
      messageList, 
      delaySeconds, 
      selectedBots 
    } = await inquirer.prompt([
      {
        type: 'input',
        name: 'commandFormat',
        message: 'Command format (use {player} and {message}):',
        default: '/msg {player} {message}',
        validate: (input) => input.includes('{player}') || 'Command must include {player} placeholder'
      },
      {
        type: 'input',
        name: 'messageList',
        message: 'Messages (comma-separated):',
        default: 'Add donut_mall on discord for the CHEAPEST EYE-R-L Offers!,Message donut_mall for exclusive deals!',
        validate: (input) => input.length > 0 || 'At least one message is required'
      },
      {
        type: 'number',
        name: 'delaySeconds',
        message: 'Delay between commands (seconds):',
        default: 2,
        validate: (input) => input >= 1 || 'Delay must be at least 1 second'
      },
      {
        type: 'checkbox',
        name: 'selectedBots',
        message: 'Select bots to use for mass command:',
        choices: connectedBots.map(bot => ({ name: bot.email, value: bot.email })),
        validate: (input) => input.length > 0 || 'Please select at least one bot'
      }
    ]);

    const messages = messageList.split(',').map(msg => msg.trim()).filter(msg => msg.length > 0);
    
    console.log(chalk.blue('\n🔄 Starting player discovery process...'));

    for (const email of selectedBots) {
      const bot = this.bots.get(email);
      if (!bot || !bot.bot || !bot.isConnected) continue;

      try {
        console.log(chalk.cyan(`\n🔍 [${email}] Starting player scraping...`));
        
        // Initialize player discovery for this bot
        if (!bot.addon) {
          console.log(chalk.yellow(`⚠️ [${email}] Addon not initialized, skipping...`));
          continue;
        }

        console.log(chalk.cyan(`\n🔍 [${email}] Starting player scraping...`));
        
        // Start player discovery using the addon
        const discoveredPlayers = await bot.addon.discoverPlayers();
        
        console.log(chalk.green(`✅ [${email}] Discovered ${discoveredPlayers.length} players`));
        
        // Start mass messaging
        await bot.addon.executeMassMessaging(commandFormat, messages, delaySeconds);
        
      } catch (error) {
        console.error(chalk.red(`❌ [${email}] Mass command failed: ${error.message}`));
      }
    }

    console.log(chalk.green('\n🎉 Mass command process completed!'));
    await this.waitForKeypress();
  }

  async teamJoinMessaging() {
    const connectedBots = Array.from(this.bots.values()).filter(bot => bot.isConnected);
    
    if (connectedBots.length === 0) {
      console.log(chalk.yellow('⚠️ No connected bots found.'));
      await this.waitForKeypress();
      return;
    }

    console.log(chalk.blue('🤖 Team Join Auto-Messaging'));
    console.log(chalk.gray('Configure automatic messages when players join teams.'));
    console.log('');

    const { 
      teamMessages, 
      enabled, 
      selectedBots 
    } = await inquirer.prompt([
      {
        type: 'input',
        name: 'teamMessages',
        message: 'Team join messages (comma-separated):',
        default: 'Welcome to the team! Add donut_mall on discord for exclusive deals!,Great to have you on the team! Contact donut_mall for special offers!',
        validate: (input) => input.length > 0 || 'At least one message is required'
      },
      {
        type: 'confirm',
        name: 'enabled',
        message: 'Enable team join messaging?',
        default: true
      },
      {
        type: 'checkbox',
        name: 'selectedBots',
        message: 'Select bots to enable team join messaging:',
        choices: connectedBots.map(bot => ({ name: bot.email, value: bot.email })),
        validate: (input) => input.length > 0 || 'Please select at least one bot'
      }
    ]);

    const messages = teamMessages.split(',').map(msg => msg.trim()).filter(msg => msg.length > 0);

    for (const email of selectedBots) {
      const bot = this.bots.get(email);
      if (!bot || !bot.addon || !bot.isConnected) continue;

      try {
        if (enabled) {
          // Enable team join messaging using addon
          bot.addon.enableTeamJoinMessaging(messages);
          console.log(chalk.green(`✅ [${email}] Team join messaging enabled`));
        } else {
          // Disable team join messaging
          bot.addon.disableTeamJoinMessaging();
          console.log(chalk.yellow(`⏹️ [${email}] Team join messaging disabled`));
        }
        
        await Database.logEvent(email, 'INFO', `Team join messaging ${enabled ? 'enabled' : 'disabled'}`);
        
      } catch (error) {
        console.error(chalk.red(`❌ [${email}] Team join setup failed: ${error.message}`));
      }
    }

    console.log(chalk.green('\n🎉 Team join messaging configuration completed!'));
    await this.waitForKeypress();
  }

  async commandLooping() {
    const connectedBots = Array.from(this.bots.values()).filter(bot => bot.isConnected);
    
    if (connectedBots.length === 0) {
      console.log(chalk.yellow('⚠️ No connected bots found.'));
      await this.waitForKeypress();
      return;
    }

    console.log(chalk.blue('🔄 Command Looping'));
    console.log(chalk.gray('Run commands repeatedly on a timer.'));
    console.log('');

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Command Loop Action:',
        choices: [
          { name: '▶️ Start Command Loop', value: 'start' },
          { name: '⏹️ Stop Command Loop', value: 'stop' },
          { name: '📊 Loop Status', value: 'status' },
          { name: '🔙 Back', value: 'back' }
        ]
      }
    ]);

    switch (action) {
      case 'start':
        await this.startCommandLoop(connectedBots);
        break;
      case 'stop':
        await this.stopCommandLoop(connectedBots);
        break;
      case 'status':
        await this.commandLoopStatus(connectedBots);
        break;
      case 'back':
        return;
    }

    await this.waitForKeypress();
  }

  async startCommandLoop(connectedBots) {
    const { 
      command, 
      intervalSeconds, 
      selectedBots 
    } = await inquirer.prompt([
      {
        type: 'input',
        name: 'command',
        message: 'Command to loop (without /)​:',
        default: 'afk 33',
        validate: (input) => input.length > 0 || 'Command cannot be empty'
      },
      {
        type: 'number',
        name: 'intervalSeconds',
        message: 'Loop interval (seconds):',
        default: 300,
        validate: (input) => input >= 5 || 'Interval must be at least 5 seconds'
      },
      {
        type: 'checkbox',
        name: 'selectedBots',
        message: 'Select bots for command looping:',
        choices: connectedBots.map(bot => ({ name: bot.email, value: bot.email })),
        validate: (input) => input.length > 0 || 'Please select at least one bot'
      }
    ]);

    for (const email of selectedBots) {
      const bot = this.bots.get(email);
      if (!bot || !bot.addon || !bot.isConnected) continue;

      try {
        // Start command loop using addon
        bot.addon.startCommandLoop(command, intervalSeconds);
        
        console.log(chalk.green(`✅ [${email}] Command loop started: /${command} every ${intervalSeconds}s`));
        await Database.logEvent(email, 'INFO', `Command loop started: ${command} (${intervalSeconds}s interval)`);
        
      } catch (error) {
        console.error(chalk.red(`❌ [${email}] Failed to start command loop: ${error.message}`));
      }
    }

    console.log(chalk.green('\n🎉 Command loops started!'));
  }

  async stopCommandLoop(connectedBots) {
    const { selectedBots } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedBots',
        message: 'Select bots to stop command loops:',
        choices: connectedBots
          .filter(bot => bot.addon && bot.addon.isCommandLoopActive())
          .map(bot => ({ name: bot.email, value: bot.email })),
        validate: (input) => input.length > 0 || 'Please select at least one bot'
      }
    ]);

    for (const email of selectedBots) {
      const bot = this.bots.get(email);
      if (!bot || !bot.addon) continue;

      try {
        // Stop command loop using addon
        bot.addon.stopCommandLoop();
        
        console.log(chalk.yellow(`⏹️ [${email}] Command loop stopped`));
        await Database.logEvent(email, 'INFO', 'Command loop stopped');
      } catch (error) {
        console.error(chalk.red(`❌ [${email}] Failed to stop command loop: ${error.message}`));
      }
    }

    console.log(chalk.green('\n🎉 Command loops stopped!'));
  }

  async commandLoopStatus(connectedBots) {
    console.log(chalk.blue('🔄 Command Loop Status'));
    console.log(chalk.gray('━'.repeat(50)));

    const activeLoops = connectedBots.filter(bot => bot.addon && bot.addon.isCommandLoopActive());
    
    if (activeLoops.length === 0) {
      console.log(chalk.yellow('⏹️ No active command loops'));
    } else {
      console.log(chalk.green(`✅ Active command loops: ${activeLoops.length}`));
      console.log('');
      
      activeLoops.forEach(bot => {
        const status = bot.addon.getStatus();
        console.log(`${chalk.cyan(bot.email)}: ${chalk.green('/' + status.commandLoopCommand)} (${chalk.yellow(status.commandLoopInterval + 's')})`);
      });
    }
  }

  async addonStatus() {
    const connectedBots = Array.from(this.bots.values()).filter(bot => bot.isConnected);
    
    console.log(chalk.blue('📊 Explore Addon Status'));
    console.log(chalk.gray('━'.repeat(50)));
    console.log(`Connected Bots: ${chalk.cyan(connectedBots.length)}`);
    console.log('');

    if (connectedBots.length === 0) {
      console.log(chalk.yellow('⚠️ No connected bots'));
      await this.waitForKeypress();
      return;
    }

    connectedBots.forEach(bot => {
      console.log(chalk.cyan(`🤖 ${bot.email}:`));
      
      if (bot.addon) {
        const status = bot.addon.getStatus();
        
        // Team join messaging status
        const teamJoinStatus = status.teamJoinEnabled ? chalk.green('Enabled') : chalk.red('Disabled');
        console.log(`   Team Join Messaging: ${teamJoinStatus}`);
        
        // Command loop status
        const loopStatus = status.commandLoopActive ? 
          chalk.green(`Active (/${status.commandLoopCommand} every ${status.commandLoopInterval}s)`) : 
          chalk.red('Inactive');
        console.log(`   Command Loop: ${loopStatus}`);
        
        // Player discovery status
        console.log(`   Discovered Players: ${chalk.yellow(status.discoveredPlayers)} | Processed: ${chalk.yellow(status.processedPlayers)}`);
        
        // Current state
        console.log(`   Current State: ${chalk.yellow(status.state)}`);
      } else {
        console.log(`   ${chalk.red('Addon not initialized')}`);
      }
      
      console.log('');
    });

    await this.waitForKeypress();
  }

  async cleanup() {
    console.log(chalk.yellow('🧹 Cleaning up...'));
    this.stopAllLoops();
    await this.disconnectAllBots();
    console.log(chalk.green('👋 Goodbye!'));
  }

  async start() {
    this.isRunning = true;
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n🛑 Received interrupt signal...'));
      await this.cleanup();
      process.exit(0);
    });

    console.log(chalk.bold.green('🚀 Starting Minecraft AFK Bot Manager...'));
    
    try {
      // Test database connection
      await Database.getAccounts();
      console.log(chalk.green('✅ Database connection successful!'));
      
      while (this.isRunning) {
        await this.showMainMenu();
      }
    } catch (error) {
      console.error(chalk.red('❌ Database connection failed:'), error.message);
      console.log(chalk.yellow('💡 Please check your .env file and Supabase configuration.'));
      process.exit(1);
    }
  }

  async accountChecker() {
    try {
      const fs = await import('fs');
      
      const filePath = 'accounts.txt';
      
      if (!fs.existsSync(filePath)) {
        console.log(chalk.yellow('⚠️ accounts.txt file not found!'));
        console.log(chalk.gray('Please create an accounts.txt file with the format:'));
        console.log(chalk.gray('email:password'));
        console.log(chalk.gray('email2:password2'));
        await this.waitForKeypress();
        return;
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.split('\n').filter(line => line.trim().length > 0);
      
      if (lines.length === 0) {
        console.log(chalk.yellow('⚠️ accounts.txt is empty!'));
        await this.waitForKeypress();
        return;
      }

      console.log(chalk.blue(`📁 Found ${lines.length} accounts to check`));
      
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Check ${lines.length} accounts from accounts.txt?`,
          default: true
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('❌ Operation cancelled.'));
        await this.waitForKeypress();
        return;
      }

      console.log(chalk.blue('🔄 Testing accounts... This may take a while.'));
      
      const workingAccounts = [];
      const failedAccounts = [];
      const invalidFormat = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line.includes(':')) {
          console.log(chalk.red(`❌ Line ${i + 1}: Invalid format - missing ':' separator`));
          invalidFormat.push(line);
          continue;
        }

        const [email, password] = line.split(':');
        
        if (!email || !password) {
          console.log(chalk.red(`❌ Line ${i + 1}: Invalid format - missing email or password`));
          invalidFormat.push(line);
          continue;
        }

        if (!email.includes('@')) {
          console.log(chalk.red(`❌ Line ${i + 1}: Invalid email format - ${email}`));
          invalidFormat.push(line);
          continue;
        }

        console.log(chalk.cyan(`🔍 Testing ${i + 1}/${lines.length}: ${email.trim()}`));
        
        try {
          // Create a test bot to check login
          const testBot = new MinecraftBot(
            email.trim(),
            password.trim(),
            'mc.hypixel.net', // Using a reliable test server
            25565
          );

          // Set silent mode to prevent any commands
          testBot.silentMode = true;
          
          // Try to connect with a shorter timeout
          await Promise.race([
            testBot.connect(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 15000)
            )
          ]);
          
          // If we get here, login was successful
          console.log(chalk.green(`✅ ${email.trim()} - Working`));
          workingAccounts.push(`${email.trim()}:${password.trim()}`);
          
          // Disconnect immediately
          testBot.disconnect();
          
        } catch (error) {
          console.log(chalk.red(`❌ ${email.trim()} - Failed: ${error.message}`));
          failedAccounts.push(`${email.trim()}:${password.trim()}`);
        }
        
        // Small delay between tests to avoid rate limiting
        if (i < lines.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Show results
      console.log('');
      console.log(chalk.blue('📊 Account Check Results:'));
      console.log(`✅ Working accounts: ${chalk.green(workingAccounts.length)}`);
      console.log(`❌ Failed accounts: ${chalk.red(failedAccounts.length)}`);
      console.log(`⚠️ Invalid format: ${chalk.yellow(invalidFormat.length)}`);
      
      // Save results to files
      if (workingAccounts.length > 0) {
        fs.writeFileSync('working_accounts.txt', workingAccounts.join('\n'));
        console.log(chalk.green('💾 Working accounts saved to working_accounts.txt'));
      }
      
      if (failedAccounts.length > 0) {
        fs.writeFileSync('failed_accounts.txt', failedAccounts.join('\n'));
        console.log(chalk.red('💾 Failed accounts saved to failed_accounts.txt'));
      }

    } catch (error) {
      console.error(chalk.red(`❌ Account checker failed: ${error.message}`));
    }

    await this.waitForKeypress();
  }
}

// Start the bot manager
const manager = new BotManager();
manager.start().catch(console.error);