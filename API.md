# API Documentation

Base URL: `http://localhost:3001/api` (or your hosted URL)

## Endpoints

### Get All Kudos
```
GET /api/kudos?limit=50&visibility=public
```

**Query Parameters:**
- `limit` (optional): Number of kudos to return (default: 50)
- `visibility` (optional): Filter by visibility - `'public'`, `'private'`, or omit for all

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "from_user_id": "U123456",
      "from_user_name": "John Doe",
      "to_user_id": "U789012",
      "to_user_name": "Jane Smith",
      "message": "Great work on the project!",
      "channel_id": "C123456",
      "channel_name": "general",
      "sent_dm": true,
      "sent_channel": true,
      "visibility": "public",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### Get Public Kudos Only
```
GET /api/kudos/public?limit=50
```

**Query Parameters:**
- `limit` (optional): Number of kudos to return (default: 50)

**Response:**
Same format as Get All Kudos, but only returns Kudos with `visibility: "public"`

**Note:** This endpoint is optimized for public feeds and only returns public Kudos.

### Get Kudos by User (Received)
```
GET /api/kudos/user/:userId?limit=10&includePrivate=true
```

**Path Parameters:**
- `userId`: Slack user ID

**Query Parameters:**
- `limit` (optional): Number of kudos to return (default: 10)
- `includePrivate` (optional): Include private Kudos (default: `true`). Set to `false` to only get public Kudos.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "from_user_id": "U123456",
      "from_user_name": "John Doe",
      "to_user_id": "U789012",
      "to_user_name": "Jane Smith",
      "message": "Great work on the project!",
      "visibility": "public",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

**Note:** Private Kudos are only visible to the sender, recipient, and their managers. The API currently returns all Kudos for a user, but future versions will implement proper authorization checks.

### Get Kudos Sent by User
```
GET /api/kudos/sent/:userId?limit=10
```

**Path Parameters:**
- `userId`: Slack user ID

**Query Parameters:**
- `limit` (optional): Number of kudos to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

### Get Statistics
```
GET /api/stats
```

**Response:**
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

### Get Leaderboard
```
GET /api/leaderboard?limit=10
```

**Query Parameters:**
- `limit` (optional): Number of top recipients to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "to_user_id": "U789012",
      "to_user_name": "Jane Smith",
      "kudos_count": 25
    },
    {
      "to_user_id": "U123456",
      "to_user_name": "John Doe",
      "kudos_count": 20
    }
  ]
}
```

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Visibility System

Kudos can be marked as either **Public** or **Private**:

- **Public Kudos**: Visible to everyone in the organization. Can be posted to channels and appear in public feeds.
- **Private Kudos**: Only visible to:
  - The sender
  - The recipient
  - The sender's manager
  - The recipient's manager
  
Private Kudos cannot be posted to channels (only sent via Direct Message).

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

HTTP status codes:
- `200` - Success
- `500` - Server error

