# API Documentation

Base URL: `http://localhost:3001/api` (or your hosted URL)

## Endpoints

### Get All Kudos
```
GET /api/kudos?limit=50
```

**Query Parameters:**
- `limit` (optional): Number of kudos to return (default: 50)

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
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### Get Kudos by User (Received)
```
GET /api/kudos/user/:userId?limit=10
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

