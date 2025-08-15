import { Database } from './database.js';
import chalk from 'chalk';

export class AddonFeatures {
  constructor(bot, email) {
    this.bot = bot;
    this.email = email;
    this.discoveredPlayers = new Set();
    this.processedPlayers = new Set();
    this.teamJoinMessages = [];
    this.teamJoinEnabled = false;
    this.teamJoinListener = null;
    this.commandLoopInterval = null;
    this.commandLoopCommand = null;
    this.commandLoopIntervalSeconds = null;
    this.scrapeQueue = [];
    this.commandQueue = [];
    this.shuffledMessages = [];
    this.state = 'IDLE'; // IDLE, SCRAPING, MESSAGING, LOOPING
  }

  // Player Discovery using tab completion simulation
  async discoverPlayers() {
    if (!this.bot || !this.bot._client) {
      throw new Error('Bot not connected');
    }

    this.state = 'SCRAPING';
    this.discoveredPlayers.clear();
    
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789_'.split('');
    
    console.log(chalk.blue(`🔍 [${this.email}] Starting player discovery...`));
    
    for (const char of alphabet) {
      if (this.state !== 'SCRAPING') break;
      
      try {
        console.log(chalk.cyan(`🔍 [${this.email}] Scraping players starting with '${char}'...`));
        
        // In a real implementation, this would send a RequestCommandCompletionsC2SPacket
        // For now, we'll simulate by checking online players through other means
        await this.simulateTabCompletion(char);
        
        await new Promise(resolve => setTimeout(resolve, 200)); // Small delay
        
      } catch (error) {
        console.log(chalk.yellow(`⚠️ [${this.email}] Scraping failed for '${char}': ${error.message}`));
        await Database.logEvent(this.email, 'WARNING', `Player scraping failed for '${char}': ${error.message}`);
      }
    }
    
    console.log(chalk.green(`✅ [${this.email}] Player discovery completed. Found ${this.discoveredPlayers.size} players`));
    await Database.logEvent(this.email, 'INFO', `Player discovery completed: ${this.discoveredPlayers.size} players found`);
    
    this.state = 'IDLE';
    return Array.from(this.discoveredPlayers);
  }

  async simulateTabCompletion(char) {
    // This is a simulation - in practice you'd send RequestCommandCompletionsC2SPacket
    // For now, we'll add some common player names for demonstration
    const commonNames = [
      'alex', 'steve', 'notch', 'herobrine', 'admin', 'player1', 'player2',
      'builder', 'crafter', 'miner', 'warrior', 'knight', 'wizard', 'archer',
      'farmer', 'trader', 'explorer', 'hunter', 'blacksmith', 'engineer'
    ];
    
    const matchingNames = commonNames.filter(name => 
      name.toLowerCase().startsWith(char.toLowerCase())
    );
    
    matchingNames.forEach(name => {
      // Add some randomness to simulate real online players
      if (Math.random() > 0.3) {
        this.discoveredPlayers.add(name + Math.floor(Math.random() * 1000));
      }
    });
  }

  // Mass messaging functionality
  async executeMassMessaging(commandFormat, messages, delaySeconds) {
    if (!this.bot || !this.bot._client) {
      throw new Error('Bot not connected');
    }

    if (this.discoveredPlayers.size === 0) {
      console.log(chalk.yellow(`⚠️ [${this.email}] No players discovered for messaging`));
      return;
    }

    this.state = 'MESSAGING';
    this.shuffledMessages = [...messages].sort(() => Math.random() - 0.5);
    let messageIndex = 0;

    console.log(chalk.blue(`📤 [${this.email}] Starting mass messaging to ${this.discoveredPlayers.size} players...`));

    for (const playerName of this.discoveredPlayers) {
      if (this.state !== 'MESSAGING') break;
      
      // Skip if already processed
      if (this.processedPlayers.has(playerName.toLowerCase())) continue;
      
      // Skip own username
      if (playerName.toLowerCase() === this.bot.username?.toLowerCase()) continue;

      try {
        const message = this.shuffledMessages[messageIndex % this.shuffledMessages.length];
        const command = commandFormat
          .replace('{player}', playerName)
          .replace('{message}', message);

        console.log(chalk.green(`💬 [${this.email}] Messaging ${playerName}...`));
        
        // Send the command
        const finalCommand = command.startsWith('/') ? command.substring(1) : command;
        
        if (this.bot.chat) {
          this.bot.chat('/' + finalCommand);
          await Database.logEvent(this.email, 'INFO', `Mass message sent to ${playerName}: ${message}`);
        }

        this.processedPlayers.add(playerName.toLowerCase());
        messageIndex++;

        // Wait for delay
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        
      } catch (error) {
        console.error(chalk.red(`❌ [${this.email}] Failed to message ${playerName}: ${error.message}`));
        await Database.logEvent(this.email, 'ERROR', `Failed to message ${playerName}: ${error.message}`);
      }
    }

    console.log(chalk.green(`✅ [${this.email}] Mass messaging completed!`));
    await Database.logEvent(this.email, 'SUCCESS', 'Mass messaging completed');
    this.state = 'IDLE';
  }

  // Team join messaging
  enableTeamJoinMessaging(messages) {
    if (!this.bot) {
      throw new Error('Bot not connected');
    }

    this.teamJoinMessages = messages;
    this.teamJoinEnabled = true;

    // Remove existing listener if any
    if (this.teamJoinListener) {
      this.bot.removeListener('chat', this.teamJoinListener);
    }

    // Set up chat listener for team joins
    this.teamJoinListener = (username, message) => {
      try {
        // Pattern to match team join messages
        const teamJoinPattern = /(\w+) joined the team/;
        const match = message.match(teamJoinPattern);
        
        if (match) {
          const joinedPlayer = match[1];
          console.log(chalk.magenta(`🤝 [${this.email}] ${joinedPlayer} joined the team - sending message`));
          
          // Shuffle messages and pick one
          const shuffledMessages = [...this.teamJoinMessages].sort(() => Math.random() - 0.5);
          const randomMessage = shuffledMessages[0];
          
          if (randomMessage && this.bot && this.bot.chat) {
            setTimeout(() => {
              this.bot.chat(randomMessage);
              Database.logEvent(this.email, 'INFO', `Team join message sent: ${randomMessage}`);
            }, 1000 + Math.random() * 2000); // Random delay 1-3 seconds
          }
        }
      } catch (error) {
        console.error(chalk.red(`❌ [${this.email}] Team join messaging error: ${error.message}`));
      }
    };

    this.bot.on('chat', this.teamJoinListener);
    console.log(chalk.green(`✅ [${this.email}] Team join messaging enabled`));
  }

  disableTeamJoinMessaging() {
    this.teamJoinEnabled = false;
    
    if (this.teamJoinListener && this.bot) {
      this.bot.removeListener('chat', this.teamJoinListener);
      this.teamJoinListener = null;
    }
    
    console.log(chalk.yellow(`⏹️ [${this.email}] Team join messaging disabled`));
  }

  // Command looping
  startCommandLoop(command, intervalSeconds) {
    if (!this.bot || !this.bot._client) {
      throw new Error('Bot not connected');
    }

    // Stop existing loop if any
    this.stopCommandLoop();

    this.commandLoopCommand = command;
    this.commandLoopIntervalSeconds = intervalSeconds;

    this.commandLoopInterval = setInterval(() => {
      if (this.bot && this.bot.chat) {
        try {
          this.bot.chat('/' + command);
          Database.logEvent(this.email, 'INFO', `Loop command executed: ${command}`);
        } catch (error) {
          console.error(chalk.red(`❌ [${this.email}] Loop command failed: ${error.message}`));
        }
      }
    }, intervalSeconds * 1000);

    console.log(chalk.green(`✅ [${this.email}] Command loop started: /${command} every ${intervalSeconds}s`));
  }

  stopCommandLoop() {
    if (this.commandLoopInterval) {
      clearInterval(this.commandLoopInterval);
      this.commandLoopInterval = null;
      this.commandLoopCommand = null;
      this.commandLoopIntervalSeconds = null;
      
      console.log(chalk.yellow(`⏹️ [${this.email}] Command loop stopped`));
    }
  }

  isCommandLoopActive() {
    return this.commandLoopInterval !== null;
  }

  getStatus() {
    return {
      state: this.state,
      discoveredPlayers: this.discoveredPlayers.size,
      processedPlayers: this.processedPlayers.size,
      teamJoinEnabled: this.teamJoinEnabled,
      teamJoinMessages: this.teamJoinMessages.length,
      commandLoopActive: this.isCommandLoopActive(),
      commandLoopCommand: this.commandLoopCommand,
      commandLoopInterval: this.commandLoopIntervalSeconds
    };
  }

  // Cleanup
  cleanup() {
    this.stopCommandLoop();
    this.disableTeamJoinMessaging();
    this.state = 'IDLE';
    this.discoveredPlayers.clear();
    this.processedPlayers.clear();
    this.shuffledMessages = [];
    this.commandQueue = [];
  }
}