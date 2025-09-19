#!/bin/bash

echo "🚀 Starting Chat MVP..."

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "node dist/index.js" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Wait a moment
sleep 1

# Start server
echo "🔧 Starting server..."
cd server
npm start &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 3

# Check if server is running
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Server is running on http://localhost:3001"
else
    echo "❌ Server failed to start"
    exit 1
fi

# Start client
echo "🎨 Starting client..."
cd ../client
npm run dev &
CLIENT_PID=$!

# Wait for client to start
echo "⏳ Waiting for client to start..."
sleep 3

# Check if client is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Client is running on http://localhost:3000"
else
    echo "❌ Client failed to start"
    exit 1
fi

echo ""
echo "🎉 Chat MVP is ready!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
echo "❤️ Health: http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $SERVER_PID 2>/dev/null || true
    kill $CLIENT_PID 2>/dev/null || true
    pkill -f "node dist/index.js" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    echo "✅ All services stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for processes
wait