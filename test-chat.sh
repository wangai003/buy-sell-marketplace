#!/bin/bash

# Chat Feature Test Script
# This script helps you test the chat feature step by step

echo "========================================="
echo "Chat Feature Test Script"
echo "========================================="
echo ""

# Check if .env exists in client directory
if [ ! -f "./client/.env" ]; then
  echo "⚠️  Warning: ./client/.env file not found!"
  echo ""
  echo "Creating default .env file..."
  echo "REACT_APP_API=http://localhost:8000/api" > ./client/.env
  echo "REACT_APP_SOCKET_URL=http://localhost:8000" >> ./client/.env
  echo "✅ Created ./client/.env with default values"
  echo ""
else
  echo "✅ Found ./client/.env file"
  echo ""
fi

# Check if node_modules exists
if [ ! -d "./node_modules" ]; then
  echo "⚠️  Backend dependencies not installed"
  echo "Run: npm install"
  echo ""
else
  echo "✅ Backend dependencies installed"
  echo ""
fi

if [ ! -d "./client/node_modules" ]; then
  echo "⚠️  Frontend dependencies not installed"
  echo "Run: cd client && npm install"
  echo ""
else
  echo "✅ Frontend dependencies installed"
  echo ""
fi

# Check MongoDB connection
echo "Checking MongoDB connection..."
if grep -q "MONGO_URI" .env; then
  echo "✅ MONGO_URI found in .env"
  echo ""
else
  echo "⚠️  Warning: MONGO_URI not found in .env"
  echo ""
fi

# Run migration
echo "========================================="
echo "Step 1: Running Chat Migration"
echo "========================================="
echo "This creates Chat documents for existing users..."
echo ""
read -p "Run migration now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  node migrate-chat.js
  echo ""
fi

# Instructions for starting servers
echo "========================================="
echo "Step 2: Start Servers"
echo "========================================="
echo ""
echo "Open TWO terminal windows and run:"
echo ""
echo "Terminal 1 (Backend):"
echo "  npm start"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd client && npm start"
echo ""

echo "========================================="
echo "Step 3: Test Chat"
echo "========================================="
echo ""
echo "1. Open http://localhost:3000 in TWO browsers (or use incognito)"
echo "2. Login with different users in each browser"
echo "3. Navigate to /messages in both browsers"
echo "4. Start chatting!"
echo ""
echo "What to test:"
echo "  ✓ Send messages between users"
echo "  ✓ Check online status indicators (green dot)"
echo "  ✓ Delete individual messages (click message, then trash icon)"
echo "  ✓ Delete entire chat (trash icon in chat list)"
echo "  ✓ Verify real-time message delivery"
echo ""

echo "========================================="
echo "Troubleshooting"
echo "========================================="
echo ""
echo "If chat doesn't work:"
echo "  1. Check browser console for errors"
echo "  2. Check backend logs for Socket.IO connection"
echo "  3. Verify MongoDB is running"
echo "  4. Check that .env files are configured correctly"
echo "  5. Run: node migrate-chat.js"
echo ""
echo "For more help, see CHAT_SETUP.md and CHAT_FIXES_SUMMARY.md"
echo ""






