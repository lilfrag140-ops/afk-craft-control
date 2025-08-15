import mineflayer from 'mineflayer';
import { Database } from './database.js';
import { AddonFeatures } from './addon-features.js';
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
    this.autoReconnect = true;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000; // 5 seconds
    this.addon = null; // Will be initialized when bot connects
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
        hideErrors: true, // Hide packet errors that interfere with CLI
        checkTimeoutInterval: 30 * 1000,
        keepAlive: true,
        logErrors: false // Disable error logging to console
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
          
          // Wait longer after spawn to appear more human-like (10-20 seconds)
          const initialDelay = Math.random() * 10000 + 10000; // Random delay between 10-20 seconds
          console.log(chalk.magenta(`⏱️ [${this.email}] Waiting ${(initialDelay/1000).toFixed(1)}s to appear more natural...`));
          
          setTimeout(async () => {
            try {
              if (this.bot && this.bot._client && this.bot.chat && this.isConnected) {
                // Send team chat first
                this.bot.chat('/team chat');
                await Database.logEvent(this.email, 'INFO', 'Team chat command sent: /team chat');
                console.log(chalk.green(`✅ [${this.email}] Team chat command sent`));
                
                // Wait another random period before AFK (5-15 seconds)
                const afkDelay = Math.random() * 10000 + 5000;
                console.log(chalk.magenta(`⏱️ [${this.email}] Waiting ${(afkDelay/1000).toFixed(1)}s before AFK command...`));
                
                setTimeout(async () => {
                  if (this.bot && this.isConnected) {
                    await this.startAFKSequence();
                  }
                }, afkDelay);
                
              } else {
                console.log(chalk.yellow(`⚠️ [${this.email}] Bot client not ready for commands`));
                await Database.logEvent(this.email, 'WARNING', 'Bot client not ready for commands');
              }
            } catch (err) {
              console.log(chalk.yellow(`⚠️ [${this.email}] Failed to send commands: ${err.message}`));
              await Database.logEvent(this.email, 'WARNING', `Failed to send commands: ${err.message}`);
            }
          }, initialDelay);
          
          // Initialize addon features after successful spawn
          this.addon = new AddonFeatures(this.bot, this.email);
          
          resolve(this.bot);
        });

        this.bot.on('kicked', async (reason) => {
          clearTimeout(timeout);
          this.isConnected = false;
          console.log(chalk.red(`👢 [${this.email}] Bot was kicked from server`));
          console.log(chalk.red(`📝 [${this.email}] Kick reason: ${JSON.stringify(reason)}`));
          
          await Database.updateAccountStatus(this.email, 'disconnected', false);
          await Database.logEvent(this.email, 'ERROR', `Kicked: ${JSON.stringify(reason)}`);
          
          // Check if it's an "already online" error and add extra delay
          const reasonStr = JSON.stringify(reason);
          const isAlreadyOnline = reasonStr.includes('already online') || reasonStr.includes('You are already online');
          
          if (this.autoReconnect) {
            console.log(chalk.yellow(`🔄 [${this.email}] Auto-reconnect triggered...`));
            if (isAlreadyOnline) {
              console.log(chalk.yellow(`⏳ [${this.email}] Already online error detected, waiting longer...`));
              setTimeout(() => this.attemptReconnect(), 15000); // 15 second delay for "already online"
            } else {
              this.attemptReconnect();
            }
          }
          
          reject(new Error(`Kicked: ${JSON.stringify(reason)}`));
        });

        this.bot.on('error', async (err) => {
          clearTimeout(timeout);
          this.isConnected = false;
          console.log(chalk.red(`💥 [${this.email}] Bot connection error occurred`));
          console.log(chalk.red(`🔍 [${this.email}] Error details: ${err.message}`));
          
          await Database.updateAccountStatus(this.email, 'failed', false);
          await Database.logEvent(this.email, 'ERROR', `Connection failed: ${err.message}`);
          
          if (this.autoReconnect) {
            console.log(chalk.yellow(`🔄 [${this.email}] Auto-reconnect triggered...`));
            await this.attemptReconnect();
          }
          
          reject(err);
        });

        this.bot.on('end', async (reason) => {
          this.isConnected = false;
          console.log(chalk.yellow(`🔚 [${this.email}] Bot connection ended`));
          console.log(chalk.yellow(`📝 [${this.email}] End reason: ${reason || 'Unknown'}`));
          
          await Database.updateAccountStatus(this.email, 'disconnected', false);
          await Database.logEvent(this.email, 'INFO', `Bot disconnected: ${reason || 'Unknown'}`);
          
          // Continue auto-reconnect even after user presses continue, unless manually disconnected
          if (this.autoReconnect && reason !== 'disconnect' && reason !== 'manual') {
            console.log(chalk.yellow(`🔄 [${this.email}] Auto-reconnect triggered...`));
            setTimeout(() => this.attemptReconnect(), 3000); // 3 second delay before reconnect
          }
        });

        // Chat event listener - only log important messages
        this.bot.on('chat', (username, message) => {
          if (username !== this.bot.username && !message.includes('has joined') && !message.includes('has left')) {
            // Only log to database, not console to avoid CLI interference
            Database.logEvent(this.email, 'INFO', `Chat: <${username}> ${message}`);
          }
        });

        // Health monitoring - log to database only
        this.bot.on('health', () => {
          Database.logEvent(this.email, 'INFO', `Health: ${this.bot.health}/${this.bot.food}`);
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
      
      console.log(chalk.magenta(`💤 [${this.email}] Starting AFK sequence...`));
      console.log(chalk.magenta(`📤 [${this.email}] Sending AFK command: /afk 33`));
      
      try {
        if (this.bot && this.bot._client && this.bot.chat && this.isConnected) {
          this.bot.chat('/afk 33');
          await Database.logEvent(this.email, 'INFO', 'AFK command sent: /afk 33');
          console.log(chalk.green(`✅ [${this.email}] AFK command sent successfully`));
        } else {
          throw new Error('Bot not properly connected for chat commands');
        }
      } catch (err) {
        console.log(chalk.yellow(`⚠️ [${this.email}] Failed to send AFK command: ${err.message}`));
        await Database.logEvent(this.email, 'WARNING', `Failed to send AFK command: ${err.message}`);
      }
      
      console.log(chalk.magenta(`🦘 [${this.email}] Setting up anti-kick jump mechanism (randomized timing)`));
      
      const scheduleNextJump = () => {
        // Random interval between 45-75 seconds to avoid patterns
        const jumpDelay = Math.random() * 30000 + 45000;
        this.jumpInterval = setTimeout(() => {
          if (this.bot && this.bot.entity && this.isConnected) {
            console.log(chalk.cyan(`🦘 [${this.email}] Performing anti-kick jump`));
            this.bot.setControlState('jump', true);
            setTimeout(() => {
              if (this.bot) {
                this.bot.setControlState('jump', false);
                console.log(chalk.green(`✅ [${this.email}] Jump completed`));
              }
            }, 100);
            // Schedule next jump
            scheduleNextJump();
          } else {
            console.log(chalk.yellow(`⚠️ [${this.email}] Bot entity not found, skipping jump`));
            // Retry in 5 seconds if bot not ready
            setTimeout(scheduleNextJump, 5000);
          }
        }, jumpDelay);
      };
      
      // Start the randomized jump cycle
      scheduleNextJump();
      
      console.log(chalk.green(`🎯 [${this.email}] AFK sequence setup completed successfully`));
      await Database.logEvent(this.email, 'SUCCESS', 'AFK sequence started successfully');
      
    } catch (error) {
      console.error(chalk.red(`💥 [${this.email}] AFK sequence failed:`, error.message));
      await Database.logEvent(this.email, 'ERROR', `AFK sequence failed: ${error.message}`);
      throw error;
    }
  }

  async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(chalk.red(`❌ [${this.email}] Max reconnect attempts reached (${this.maxReconnectAttempts}). Giving up.`));
      await Database.logEvent(this.email, 'ERROR', `Max reconnect attempts reached (${this.maxReconnectAttempts})`);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts; // Exponential backoff
    
    console.log(chalk.cyan(`⏰ [${this.email}] Waiting ${delay/1000} seconds before reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`));
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      console.log(chalk.blue(`🔄 [${this.email}] Attempting to reconnect...`));
      await this.connect();
      await this.startAFKSequence();
      
      this.reconnectAttempts = 0; // Reset counter on successful reconnect
      console.log(chalk.green(`✅ [${this.email}] Successfully reconnected and resumed AFK!`));
      await Database.logEvent(this.email, 'SUCCESS', 'Successfully reconnected and resumed AFK');
      
    } catch (error) {
      console.log(chalk.red(`❌ [${this.email}] Reconnect attempt ${this.reconnectAttempts} failed: ${error.message}`));
      await Database.logEvent(this.email, 'ERROR', `Reconnect attempt ${this.reconnectAttempts} failed: ${error.message}`);
      
      // Try again after delay
      setTimeout(() => this.attemptReconnect(), 2000);
    }
  }

  disconnect() {
    console.log(chalk.yellow(`🔌 [${this.email}] Disconnecting bot...`));
    
    this.autoReconnect = false; // Disable auto-reconnect when manually disconnecting
    
    if (this.jumpInterval) {
      clearTimeout(this.jumpInterval);
      this.jumpInterval = null;
    }
    
    if (this.bot) {
      this.bot.end('manual'); // Pass 'manual' as reason to prevent auto-reconnect
      this.bot = null;
    }
    
    this.isConnected = false;
    this.reconnectAttempts = 0; // Reset reconnect attempts
    
    // Cleanup addon features
    if (this.addon) {
      this.addon.cleanup();
      this.addon = null;
    }
    
    console.log(chalk.yellow(`✅ [${this.email}] Bot disconnected successfully`));
  }
}