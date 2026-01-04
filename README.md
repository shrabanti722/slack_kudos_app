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
- 💾 Store all kudos in database (SQLite for local, PostgreSQL for hosting)
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
   
   **For local development (SQLite):**
   ```env
   SLACK_BOT_TOKEN=xoxb-your-actual-bot-token
   SLACK_SIGNING_SECRET=your-actual-signing-secret
   SLACK_APP_TOKEN=xapp-your-actual-app-token
   DB_PATH=./kudos.db
   DEFAULT_CHANNEL=#general
   ```
   
   **For hosting (PostgreSQL):**
   ```env
   SLACK_BOT_TOKEN=xoxb-your-actual-bot-token
   SLACK_SIGNING_SECRET=your-actual-signing-secret
   SLACK_APP_TOKEN=xapp-your-actual-app-token
   DATABASE_URL=postgresql://user:password@host:port/database
   DEFAULT_CHANNEL=#general
   PORT=3001
   ```
   
   > **Note:** The `PORT` environment variable is used by the web server. Most hosting platforms automatically set this. The Slack bot uses Socket Mode and doesn't require a port.
   
   > **Note:** If `DATABASE_URL` is set, the bot will use PostgreSQL. Otherwise, it defaults to SQLite for local development.

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

## Database

The bot supports two database options:

- **SQLite** (default for local development) - Database file (`kudos.db`) will be created automatically
- **PostgreSQL** (recommended for hosting) - Set `DATABASE_URL` environment variable to use PostgreSQL

The bot automatically detects which database to use based on the `DATABASE_URL` environment variable. If `DATABASE_URL` is set, it uses PostgreSQL; otherwise, it uses SQLite.

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

### Bot doesn't respond to `/kudos`
- Make sure the bot is running (`npm start`)
- Verify all tokens in `.env` are correct
- Check that Socket Mode is enabled in Slack app settings
- Ensure the slash command is created and saved

### "Missing required scope" errors
- Go to OAuth & Permissions in Slack app settings
- Make sure all required scopes are added (see step 2)
- Reinstall the app to your workspace after adding scopes

### Can't see users/channels in dropdown
- Check that the bot has `users:read`, `channels:read`, and `groups:read` scopes
- Make sure the bot is installed to the workspace

### Database errors
- **SQLite:** Ensure the directory is writable
- **PostgreSQL:** Verify your `DATABASE_URL` connection string is correct
- Check that database dependencies are installed: `npm install`

## Hosting the Bot

Since local SQLite files don't persist on most hosting platforms, you'll need to use PostgreSQL for production hosting.

### Quick Hosting Options

#### Option 1: Railway (Recommended)

1. **Create a Railway account** at [railway.app](https://railway.app)
2. **Create a new project** and connect your GitHub repository
3. **Add PostgreSQL service:**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will automatically create a `DATABASE_URL` environment variable
4. **Add environment variables:**
   - `SLACK_BOT_TOKEN` - Your bot token
   - `SLACK_SIGNING_SECRET` - Your signing secret
   - `SLACK_APP_TOKEN` - Your app token
   - `DATABASE_URL` - Automatically set by Railway PostgreSQL service
   - `PORT` - Railway sets this automatically
5. **Deploy:** Railway will automatically deploy when you push to your repository

#### Option 2: Render

1. **Create a Render account** at [render.com](https://render.com)
2. **Create a new Web Service** and connect your repository
3. **Add PostgreSQL database:**
   - Create a new PostgreSQL database
   - Copy the "Internal Database URL" or "External Database URL"
4. **Configure environment variables:**
   - Add all required Slack tokens
   - Set `DATABASE_URL` to your PostgreSQL connection string
5. **Deploy:** Render will build and deploy your bot

#### Option 3: Heroku

1. **Create a Heroku account** and install Heroku CLI
2. **Create a new app:**
   ```bash
   heroku create your-kudos-bot
   ```
3. **Add PostgreSQL addon:**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```
   This automatically sets `DATABASE_URL`
4. **Set environment variables:**
   ```bash
   heroku config:set SLACK_BOT_TOKEN=xoxb-your-token
   heroku config:set SLACK_SIGNING_SECRET=your-secret
   heroku config:set SLACK_APP_TOKEN=xapp-your-token
   ```
5. **Deploy:**
   ```bash
   git push heroku main
   ```

#### Option 4: Fly.io

1. **Install Fly CLI** and create an account
2. **Create a PostgreSQL database:**
   ```bash
   fly postgres create --name kudos-db
   ```
3. **Attach database to your app:**
   ```bash
   fly postgres attach kudos-db --app your-kudos-bot
   ```
4. **Set environment variables** in `fly.toml` or via CLI
5. **Deploy:**
   ```bash
   fly deploy
   ```

### Getting a PostgreSQL Database

If your hosting platform doesn't provide PostgreSQL, you can use:

- **Supabase** (free tier available): [supabase.com](https://supabase.com)
- **Neon** (serverless PostgreSQL): [neon.tech](https://neon.tech)
- **ElephantSQL** (free tier available): [elephantsql.com](https://elephantsql.com)

After creating a database, copy the connection string and set it as `DATABASE_URL`.

### Database Connection String Format

PostgreSQL connection strings typically look like:
```
postgresql://username:password@host:port/database
```

For hosted databases with SSL (most common):
```
postgresql://username:password@host:port/database?sslmode=require
```

## Future Enhancements

- Add `/kudos-history` command to view past kudos
- Add `/kudos-stats` to see kudos leaderboard
- Support for scheduled kudos
- Integration with other tools
- Web dashboard for viewing kudos

## License

MIT

