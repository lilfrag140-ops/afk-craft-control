# Minecraft AFK Bot Manager

A Node.js application that connects Minecraft bots to servers and keeps them AFK using the `/afk 33` command with anti-kick jumping mechanism.

## Features

- 🤖 **Real Minecraft Bot Connection** - Uses mineflayer to actually connect to Minecraft servers
- 💤 **AFK Management** - Automatically sends `/afk 33` command and performs anti-kick jumps
- 📊 **Database Integration** - Stores accounts and logs in Supabase
- 👥 **Multi-Account Support** - Manage multiple Minecraft accounts
- 🎮 **Interactive CLI** - Easy-to-use command line interface
- 📝 **Real-time Logging** - See what's happening with your bots

## Prerequisites

- Node.js 18+ installed
- Microsoft Minecraft account(s)
- Supabase account (for data storage)

## Installation

1. **Clone/Download the project**
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Update the Supabase credentials if needed

## Usage

### Start the Bot Manager
```bash
npm start
```

### Development Mode (with auto-restart)
```bash
npm run dev
```

## How It Works

1. **Add Accounts** - Store your Microsoft Minecraft credentials securely in Supabase
2. **Connect Bots** - Select which accounts to connect to the Minecraft server
3. **AFK Mode** - Bots automatically:
   - Join the server using Microsoft authentication
   - Send `/afk 33` command after spawning
   - Perform anti-kick jumps every 60 seconds
   - Log all activities to the database

## Menu Options

- 🔗 **Connect Bot(s)** - Connect selected accounts to the Minecraft server
- 🔌 **Disconnect All Bots** - Safely disconnect all active bots
- 👥 **Manage Accounts** - Add new accounts or view existing ones
- 📊 **View Status** - See current bot status and server information
- 🚪 **Exit** - Safely shutdown all bots and exit

## Database Tables

The application uses these Supabase tables:
- `accounts` - Stores Minecraft account credentials and status
- `bot_logs` - Logs all bot activities and events
- `server_configs` - Server configuration (IP, port)

## Safety Features

- **Graceful Shutdown** - Ctrl+C safely disconnects all bots
- **Error Handling** - Comprehensive error handling and logging
- **Connection Monitoring** - Tracks bot status in real-time
- **Anti-Kick System** - Periodic jumping to prevent server kicks

## Server Configuration

Default server: `donutsmp.net:25565`

You can modify the server settings in your `.env` file or through the Supabase `server_configs` table.

## Troubleshooting

### Common Issues

1. **Authentication Failed**: Make sure you're using valid Microsoft account credentials
2. **Connection Timeout**: Check if the server is online and accessible
3. **Database Errors**: Verify your Supabase configuration in `.env`

### Logs

All bot activities are logged to:
- Console output (real-time)
- Supabase `bot_logs` table (persistent)

## Security

- Credentials are stored securely in Supabase
- Environment variables for sensitive configuration
- No hardcoded passwords or API keys

## License

MIT License - Feel free to modify and distribute!

---

## Original Lovable Project Info

**URL**: https://lovable.dev/projects/ec5fb43e-6f17-47cd-8d9a-01185057a4a5

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
