# Chat Feature Setup Guide

## Environment Configuration

### Client-Side (.env file in /client directory)

Create a `.env` file in the `client` directory with the following variables:

```
# API Configuration
REACT_APP_API=http://localhost:8000/api

# Socket.IO Configuration (defaults to REACT_APP_API if not set)
REACT_APP_SOCKET_URL=http://localhost:8000
```

### Server-Side (.env file in root directory)

Make sure your root `.env` file includes:

```
PORT=8000
MONGO_URI=your_mongodb_connection_string
```

## How the Chat Works

1. **Socket.IO Connection**: The chat uses Socket.IO for real-time messaging
2. **Routes**: 
   - `/messages` - Main chat interface showing chat list and messages
3. **Features**:
   - Real-time messaging
   - Online status indicators
   - Message deletion (for sender only)
   - Chat history
   - Unread message notifications

## Troubleshooting

### Chat not loading:
- Ensure Socket.IO is properly configured on both client and server
- Check that the REACT_APP_SOCKET_URL matches your server URL
- Verify MongoDB connection is working
- Check browser console for errors

### Messages not sending:
- Check that Socket.IO connection is established (look for console logs)
- Verify user authentication is working
- Check server logs for errors

### Users not seeing online status:
- Socket.IO must be properly connected
- Check that the 'join' event is being emitted on connection







