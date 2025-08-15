#!/usr/bin/env node

import { Database } from './database.js';
import { MinecraftBot } from './minecraft-bot.js';
import inquirer from 'inquirer';
import chalk from 'chalk';

class BotManager {
  constructor() {
    this.bots = new Map();
    this.isRunning = false;
  }

  async showMainMenu() {
    console.clear();
    console.log(chalk.bold.blue('🎮 Minecraft AFK Bot Manager'));
    console.log(chalk.gray('━'.repeat(50)));

    const accounts = await Database.getAccounts();
    const connectedBots = Array.from(this.bots.values()).filter(bot => bot.isConnected);

    console.log(chalk.cyan(`📊 Status: ${accounts.length} accounts, ${connectedBots.length} connected`));
    console.log('');

    const choices = [
      { name: '🔗 Connect Bot(s)', value: 'connect' },
      { name: '🔌 Disconnect All Bots', value: 'disconnect', disabled: connectedBots.length === 0 },
      { name: '👥 Manage Accounts', value: 'accounts' },
      { name: '📊 View Status', value: 'status' },
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

    switch (action) {
      case 'connect':
        await this.connectBots();
        break;
      case 'disconnect':
        await this.disconnectAllBots();
        break;
      case 'accounts':
        await this.manageAccounts();
        break;
      case 'status':
        await this.showStatus();
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
          { name: '➕ Add Account', value: 'add' },
          { name: '📋 List Accounts', value: 'list' },
          { name: '🔙 Back to Main Menu', value: 'back' }
        ]
      }
    ]);

    switch (action) {
      case 'add':
        await this.addAccount();
        break;
      case 'list':
        await this.listAccounts();
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

  async cleanup() {
    console.log(chalk.yellow('🧹 Cleaning up...'));
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
}

// Start the bot manager
const manager = new BotManager();
manager.start().catch(console.error);