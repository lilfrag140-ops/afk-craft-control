import mineflayer from 'mineflayer';
import { Database } from './database.js';
import chalk from 'chalk';

export class MinecraftBot {
  constructor(email, password, serverIp, serverPort) {
    this.email = email;
    this.password = password;
    this.serverIp = serverIp;
    this.serverPort = serverPort;
    this.bot = null;
    this.jumpInterval = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      console.log(chalk.blue(`🔄 [${this.email}] Connecting to ${this.serverIp}:${this.serverPort}...`));
      
      await Database.updateAccountStatus(this.email, 'connecting', false);
      await Database.logEvent(this.email, 'INFO', `Attempting connection to ${this.serverIp}:${this.serverPort}`);

      this.bot = mineflayer.createBot({
        host: this.serverIp,
        port: this.serverPort,
        username: this.email,
        password: this.password,
        auth: 'microsoft',
        version: false, // Let mineflayer auto-detect server version
        hideErrors: false,
        checkTimeoutInterval: 30 * 1000,
        keepAlive: true
      });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log(chalk.red(`⏰ [${this.email}] Connection timeout after 30 seconds`));
          this.bot?.end();
          reject(new Error('Connection timeout after 30 seconds'));
        }, 30000);

        this.bot.once('login', () => {
          console.log(chalk.green(`🔐 [${this.email}] Successfully logged in to server`));
        });

        this.bot.once('spawn', async () => {
          clearTimeout(timeout);
          this.isConnected = true;
          console.log(chalk.green(`🎮 [${this.email}] Successfully spawned in server world`));
          console.log(chalk.cyan(`📍 [${this.email}] Bot position: x=${this.bot.entity?.position?.x?.toFixed(2)}, y=${this.bot.entity?.position?.y?.toFixed(2)}, z=${this.bot.entity?.position?.z?.toFixed(2)}`));
          console.log(chalk.yellow(`❤️ [${this.email}] Bot health: ${this.bot.health}`));
          
          await Database.updateAccountStatus(this.email, 'connected', true);
          await Database.logEvent(this.email, 'SUCCESS', 'Successfully connected to server');
          
          // Send /team chat immediately upon spawn
          console.log(chalk.magenta(`🛡️ [${this.email}] Sending team chat command immediately...`));
          this.bot.chat('/team chat');
          await Database.logEvent(this.email, 'INFO', 'Team chat command sent: /team chat');
          console.log(chalk.green(`✅ [${this.email}] Team chat command sent`));
          
          resolve(this.bot);
        });

        this.bot.on('kicked', async (reason) => {
          clearTimeout(timeout);
          this.isConnected = false;
          console.log(chalk.red(`👢 [${this.email}] Bot was kicked from server`));
          console.log(chalk.red(`📝 [${this.email}] Kick reason: ${JSON.stringify(reason)}`));
          
          await Database.updateAccountStatus(this.email, 'disconnected', false);
          await Database.logEvent(this.email, 'ERROR', `Kicked: ${JSON.stringify(reason)}`);
          
          reject(new Error(`Kicked: ${JSON.stringify(reason)}`));
        });

        this.bot.on('error', async (err) => {
          clearTimeout(timeout);
          this.isConnected = false;
          console.log(chalk.red(`💥 [${this.email}] Bot connection error occurred`));
          console.log(chalk.red(`🔍 [${this.email}] Error details: ${err.message}`));
          
          await Database.updateAccountStatus(this.email, 'failed', false);
          await Database.logEvent(this.email, 'ERROR', `Connection failed: ${err.message}`);
          
          reject(err);
        });

        this.bot.on('end', async (reason) => {
          this.isConnected = false;
          console.log(chalk.yellow(`🔚 [${this.email}] Bot connection ended`));
          console.log(chalk.yellow(`📝 [${this.email}] End reason: ${reason || 'Unknown'}`));
          
          await Database.updateAccountStatus(this.email, 'disconnected', false);
          await Database.logEvent(this.email, 'INFO', `Bot disconnected: ${reason || 'Unknown'}`);
        });

        // Chat event listener
        this.bot.on('chat', (username, message) => {
          if (username !== this.bot.username) {
            console.log(chalk.gray(`💬 [${this.email}] <${username}> ${message}`));
          }
        });

        // Health monitoring
        this.bot.on('health', () => {
          console.log(chalk.cyan(`❤️ [${this.email}] Health: ${this.bot.health}/${this.bot.food}`));
        });
      });
    } catch (error) {
      console.error(chalk.red(`💥 [${this.email}] Connection failed:`, error.message));
      await Database.updateAccountStatus(this.email, 'failed', false);
      await Database.logEvent(this.email, 'ERROR', `Connection failed: ${error.message}`);
      throw error;
    }
  }

  async startAFKSequence() {
    if (!this.bot || !this.isConnected) {
      throw new Error('Bot is not connected');
    }

    try {
      console.log(chalk.magenta(`⏱️ [${this.email}] Waiting 2 seconds before AFK command...`));
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(chalk.magenta(`💤 [${this.email}] Starting AFK sequence...`));
      console.log(chalk.magenta(`📤 [${this.email}] Sending AFK command: /afk 33`));
      
      this.bot.chat('/afk 33');
      await Database.logEvent(this.email, 'INFO', 'AFK command sent: /afk 33');
      
      console.log(chalk.green(`✅ [${this.email}] AFK command sent successfully`));
      
      console.log(chalk.magenta(`🦘 [${this.email}] Setting up anti-kick jump mechanism (every 60 seconds)`));
      
      this.jumpInterval = setInterval(() => {
        if (this.bot && this.bot.entity && this.isConnected) {
          console.log(chalk.cyan(`🦘 [${this.email}] Performing anti-kick jump`));
          this.bot.setControlState('jump', true);
          setTimeout(() => {
            if (this.bot) {
              this.bot.setControlState('jump', false);
              console.log(chalk.green(`✅ [${this.email}] Jump completed`));
            }
          }, 100);
        } else {
          console.log(chalk.yellow(`⚠️ [${this.email}] Bot entity not found, skipping jump`));
        }
      }, 60000); // Jump every 60 seconds
      
      console.log(chalk.green(`🎯 [${this.email}] AFK sequence setup completed successfully`));
      await Database.logEvent(this.email, 'SUCCESS', 'AFK sequence started successfully');
      
    } catch (error) {
      console.error(chalk.red(`💥 [${this.email}] AFK sequence failed:`, error.message));
      await Database.logEvent(this.email, 'ERROR', `AFK sequence failed: ${error.message}`);
      throw error;
    }
  }

  disconnect() {
    console.log(chalk.yellow(`🔌 [${this.email}] Disconnecting bot...`));
    
    if (this.jumpInterval) {
      clearInterval(this.jumpInterval);
      this.jumpInterval = null;
    }
    
    if (this.bot) {
      this.bot.end();
      this.bot = null;
    }
    
    this.isConnected = false;
    console.log(chalk.yellow(`✅ [${this.email}] Bot disconnected successfully`));
  }
}