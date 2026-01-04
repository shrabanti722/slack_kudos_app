# Slack Kudos Bot 🎉

A Slack bot that allows team members to send kudos to each other with options to post in channels, send DMs, or both.

## Features

- ✨ `/kudos` slash command to open an interactive modal
- 👥 Select any team member to send kudos to
- 💬 Custom message input with validation
- 🎨 Choose from various emoji options
- 📢 Post kudos to channels
- 💌 Send kudos via Direct Message
- 🔄 Option to do both (channel + DM)
- 💾 Store all kudos in Supabase (PostgreSQL database)
- 🌐 Web dashboard to view kudos, statistics, and leaderboard
- 📊 RESTful API for accessing kudos data

## Prerequisites

- Node.js 18+ installed
- A Slack workspace where you have permission to create apps
- Basic knowledge of Slack app configuration

## Setup Instructions

### 1. Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"** → **"From scratch"**
3. Name your app (e.g., "Kudos Bot") and select your workspace
4. Click **"Create App"**

### 2. Configure OAuth & Permissions

1. In the left sidebar, go to **"OAuth & Permissions"**
2. Scroll down to **"Scopes"** → **"Bot Token Scopes"**
3. Add the following scopes:
   - `chat:write` - Send messages
   - `chat:write.public` - Post to channels (if bot isn't a member)
   - `commands` - Handle slash commands
   - `users:read` - Read user information
   - `channels:read` - Read public channels
   - `groups:read` - Read private channels
   - `im:write` - Send direct messages
   - `im:read` - Read direct messages

### 3. Enable Socket Mode

1. In the left sidebar, go to **"Socket Mode"**
2. Toggle **"Enable Socket Mode"** to ON
3. Click **"Create Token"** under "App-Level Tokens"
4. Name it (e.g., "kudos-bot-token") and add scope: `connections:write`
5. Copy the token (starts with `xapp-`) - you'll need this for `SLACK_APP_TOKEN`

### 4. Create Slash Command

1. In the left sidebar, go to **"Slash Commands"**
2. Click **"Create New Command"**
3. Fill in:
   - **Command**: `/kudos`
   - **Short Description**: `Send kudos to a team member`
   - **Usage Hint**: `[optional]`
4. Click **"Save"**

### 5. Install App to Workspace

1. Go to **"OAuth & Permissions"** in the left sidebar
2. Click **"Install to Workspace"** at the top
3. Review permissions and click **"Allow"**
4. Copy the **"Bot User OAuth Token"** (starts with `xoxb-`) - you'll need this for `SLACK_BOT_TOKEN`

### 6. Get Signing Secret

1. In the left sidebar, go to **"Basic Information"**
2. Under **"App Credentials"**, find **"Signing Secret"**
3. Click **"Show"** and copy it - you'll need this for `SLACK_SIGNING_SECRET`

### 7. Install Dependencies

```bash
cd slack-kudos-bot
npm install
```

### 8. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your tokens:
   ```env
   SLACK_BOT_TOKEN=xoxb-your-actual-bot-token
   SLACK_SIGNING_SECRET=your-actual-signing-secret
   SLACK_APP_TOKEN=xapp-your-actual-app-token
   DATABASE_URL=postgresql://postgres:yourpassword@db.xxxxx.supabase.co:5432/postgres
   DEFAULT_CHANNEL=#general
   PORT=3001
   ```
   
   > **Note:** The `PORT` environment variable is used by the web server. Most hosting platforms automatically set this. The Slack bot uses Socket Mode and doesn't require a port.
   
   > **Note:** See the "Database Setup with Supabase" section below for detailed instructions on getting your `DATABASE_URL`.

### 9. Run the Bot

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

You should see:
```
⚡️ Slack Kudos Bot is running!
Ready to receive /kudos commands!
🌐 Web server is running on http://localhost:3001
📊 API available at http://localhost:3001/api
```

### 10. Test in Slack

1. Go to your Slack workspace
2. Type `/kudos` in any channel or DM
3. The modal should open with the kudos form!

### 11. Access the Web Dashboard

1. Open your browser and go to `http://localhost:3001`
2. You'll see the Kudos Dashboard with:
   - Overall statistics
   - Top kudos recipients leaderboard
   - Recent kudos feed
   - Search functionality to find kudos by user ID

## Usage

1. Type `/kudos` in Slack
2. Select a team member from the dropdown
3. Write your kudos message (minimum 10 characters)
4. Choose an emoji (optional, defaults to 🎉)
5. Select where to send:
   - ☑️ Send Direct Message to recipient
   - ☑️ Post in a channel (then select the channel)
6. Click "Send Kudos"

The bot will:
- Send the kudos to the selected locations
- Store it in the database
- Show you a confirmation message

## Database Setup with Supabase

This project uses Supabase (PostgreSQL) for database storage. Supabase works great for both local development and production hosting.

### Setting Up Supabase

1. **Create a Supabase account** at [supabase.com](https://supabase.com)
2. **Create a new project:**
   - Click "New Project"
   - Choose your organization
   - Enter a project name (e.g., "slack-kudos-bot")
   - Enter a database password (save this securely!)
   - Choose a region closest to your location
   - Click "Create new project"
3. **Wait for the project to be ready** (takes 1-2 minutes)
4. **Get your connection string:**
   
   **Method 1 (Recommended):**
   - In your Supabase project dashboard, look at the left sidebar
   - Click on **"Project Settings"** (gear icon ⚙️ at the bottom of the sidebar)
   - Click on **"Database"** in the settings menu
   - Scroll down to find **"Connection string"** or **"Connection pooling"** section
   - Look for **"URI"** or **"Connection string"** - it should show a string starting with `postgresql://`
   - Click on the connection string to copy it, or use the copy button
   
   **Method 2 (Alternative - If you can't find it in Settings):**
   - The connection string format is: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - To find your project reference:
     - Go to **Project Settings** → **General**
     - Look for **"Reference ID"** or check your project URL
     - It's the part between `db.` and `.supabase.co` in your database URL
   - Replace `[YOUR-PASSWORD]` with the database password you set when creating the project
   - Replace `[PROJECT-REF]` with your project reference ID
   
   The connection string should look like: `postgresql://postgres:yourpassword@db.abcdefghijklmnop.supabase.co:5432/postgres`

5. **Add to your `.env` file:**
   ```env
   DATABASE_URL=postgresql://postgres:yourpassword@db.xxxxx.supabase.co:5432/postgres
   ```

The bot will automatically detect Supabase and configure SSL connections correctly. The `kudos` table will be created automatically on first run.

**Note:** Supabase's free tier includes:
- 500 MB database storage
- 2 GB bandwidth
- Perfect for small to medium teams

### Database Schema

- `id` - Unique identifier
- `from_user_id` - Slack user ID of sender
- `from_user_name` - Display name of sender
- `to_user_id` - Slack user ID of recipient
- `to_user_name` - Display name of recipient
- `message` - The kudos message
- `channel_id` - Channel ID (if posted to channel)
- `channel_name` - Channel name (if posted to channel)
- `sent_dm` - Boolean: whether DM was sent
- `sent_channel` - Boolean: whether channel post was sent
- `created_at` - Timestamp

## Web Dashboard & API

The project includes a web dashboard and RESTful API for viewing kudos data.

### Web Dashboard

Access the dashboard at `http://localhost:3001` (or your hosted URL). The dashboard includes:

- **Statistics Overview**: Total kudos, unique recipients/senders, and activity in the last 7 days
- **Leaderboard**: Top kudos recipients ranked by number of kudos received
- **Recent Kudos Feed**: Latest kudos posted across the team
- **User Search**: Find all kudos received by a specific Slack user ID

### API Endpoints

All API endpoints are prefixed with `/api`:

#### Get All Kudos
```
GET /api/kudos?limit=50
```
Returns a list of all kudos (default limit: 50)

#### Get Kudos by User
```
GET /api/kudos/user/:userId?limit=10
```
Returns kudos received by a specific user (default limit: 10)

#### Get Kudos Sent by User
```
GET /api/kudos/sent/:userId?limit=10
```
Returns kudos sent by a specific user (default limit: 10)

#### Get Statistics
```
GET /api/stats
```
Returns overall statistics:
```json
{
  "success": true,
  "data": {
    "total": 150,
    "uniqueRecipients": 25,
    "uniqueSenders": 30,
    "last7Days": 12
  }
}
```

#### Get Leaderboard
```
GET /api/leaderboard?limit=10
```
Returns top kudos recipients (default limit: 10)

#### Health Check
```
GET /health
```
Returns server health status

### Frontend Development

The frontend code is located in the `public/` directory:
- `public/index.html` - Main HTML structure
- `public/css/style.css` - Styling
- `public/js/app.js` - JavaScript for API calls and UI interactions

You can customize and extend the frontend as needed. The current implementation provides a basic foundation that can be enhanced with:
- User authentication/identification
- Advanced filtering and sorting
- Pagination
- Real-time updates
- Charts and visualizations
- Export functionality

## Troubleshooting

### Bot doesn't respond to `/kudos` or shows "dispatch_failed"

This error usually means the bot isn't running or Socket Mode isn't connected. Follow these steps:

1. **Make sure the bot is running:**
   ```bash
   npm start
   ```
   
   You should see:
   ```
   ✅ Connected to PostgreSQL database
   ⚡️ Slack Kudos Bot is running!
   Ready to receive /kudos commands!
   🌐 Web server is running on http://localhost:3001
   ```

2. **Verify your `.env` file has all required variables:**
   ```bash
   # Check if .env file exists and has all tokens
   cat .env
   ```
   
   Make sure you have:
   - `SLACK_BOT_TOKEN` (starts with `xoxb-`)
   - `SLACK_SIGNING_SECRET`
   - `SLACK_APP_TOKEN` (starts with `xapp-`)
   - `DATABASE_URL` (your Supabase connection string)

3. **Check Socket Mode is enabled:**
   - Go to [api.slack.com/apps](https://api.slack.com/apps)
   - Select your app
   - Go to **"Socket Mode"** in the left sidebar
   - Make sure it's toggled **ON**
   - Verify you have an App-Level Token with `connections:write` scope

4. **Verify the slash command is set up:**
   - Go to **"Slash Commands"** in your Slack app settings
   - Make sure `/kudos` command exists
   - The Request URL doesn't matter for Socket Mode (it's not used)

5. **Check for error messages in the console:**
   - Look for any red error messages when you start the bot
   - Common errors:
     - `Failed to initialize database` - Check your `DATABASE_URL`
     - `An API error occurred: invalid_auth` - Check your tokens
     - `Socket connection failed` - Check your `SLACK_APP_TOKEN`

6. **Reinstall the app to workspace (if needed):**
   - Go to **"OAuth & Permissions"**
   - Click **"Reinstall to Workspace"**
   - Copy the new `SLACK_BOT_TOKEN` if it changed
   - Update your `.env` file with the new token
   - Restart the bot

### "Missing required scope" errors
- Go to OAuth & Permissions in Slack app settings
- Make sure all required scopes are added (see step 2)
- Reinstall the app to your workspace after adding scopes

### Can't see users/channels in dropdown
- Check that the bot has `users:read`, `channels:read`, and `groups:read` scopes
- Make sure the bot is installed to the workspace

### Database errors
- Verify your `DATABASE_URL` connection string is correct
- Make sure your Supabase project is active and the database password is correct
- Check that database dependencies are installed: `npm install`
- Ensure your Supabase project hasn't been paused (free tier projects pause after inactivity)

## Hosting the Bot

The bot uses Supabase for database storage, which works seamlessly for both local development and production hosting.

**Important:** This project requires a persistent connection for Socket Mode, so it needs a hosting platform that supports long-running processes (not serverless functions).

### Quick Hosting Options

#### Option 1: Railway (Recommended)

1. **Create a Railway account** at [railway.app](https://railway.app)
2. **Create a new project** and connect your GitHub repository
3. **Add environment variables:**
   - `SLACK_BOT_TOKEN` - Your bot token
   - `SLACK_SIGNING_SECRET` - Your signing secret
   - `SLACK_APP_TOKEN` - Your app token
   - `DATABASE_URL` - Your Supabase connection string (see Database Setup above)
   - `PORT` - Railway sets this automatically
4. **Deploy:** Railway will automatically deploy when you push to your repository

#### Option 2: Render

1. **Create a Render account** at [render.com](https://render.com)
2. **Create a new Web Service** and connect your repository
3. **Configure environment variables:**
   - Add all required Slack tokens
   - Set `DATABASE_URL` to your Supabase connection string
4. **Deploy:** Render will build and deploy your bot

#### Option 3: Heroku

1. **Create a Heroku account** and install Heroku CLI
2. **Create a new app:**
   ```bash
   heroku create your-kudos-bot
   ```
3. **Set environment variables:**
   ```bash
   heroku config:set SLACK_BOT_TOKEN=xoxb-your-token
   heroku config:set SLACK_SIGNING_SECRET=your-secret
   heroku config:set SLACK_APP_TOKEN=xapp-your-token
   heroku config:set DATABASE_URL=postgresql://postgres:yourpassword@db.xxxxx.supabase.co:5432/postgres
   ```
4. **Deploy:**
   ```bash
   git push heroku main
   ```

#### Option 4: Fly.io

1. **Install Fly CLI** and create an account
2. **Set environment variables** in `fly.toml` or via CLI:
   ```bash
   fly secrets set SLACK_BOT_TOKEN=xoxb-your-token
   fly secrets set SLACK_SIGNING_SECRET=your-secret
   fly secrets set SLACK_APP_TOKEN=xapp-your-token
   fly secrets set DATABASE_URL=postgresql://postgres:yourpassword@db.xxxxx.supabase.co:5432/postgres
   ```
3. **Deploy:**
   ```bash
   fly deploy
   ```

### Can I Use Vercel?

**Short answer: Not recommended for the full project.**

Vercel is designed for serverless functions and static sites. This project uses **Socket Mode**, which requires a **persistent WebSocket connection** that can't be maintained in serverless functions.

**Why it won't work:**
- Socket Mode needs a long-running process to maintain the WebSocket connection
- Vercel's serverless functions have execution time limits and are stateless
- The bot would disconnect every time a function times out

**If you really want to use Vercel**, you would need to:
1. **Host the Slack bot separately** on Railway/Render/Fly.io (for Socket Mode)
2. **Deploy only the web server/API to Vercel** as serverless functions
3. This requires separating the bot code from the web server code

**Recommendation:** For simplicity, host everything on one platform like **Railway** or **Render**, which support persistent processes and are perfect for this use case.

## Future Enhancements

- Add `/kudos-history` command to view past kudos
- Add `/kudos-stats` to see kudos leaderboard
- Support for scheduled kudos
- Integration with other tools
- Web dashboard for viewing kudos

## License

MIT

