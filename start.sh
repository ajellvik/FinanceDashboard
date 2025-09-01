#!/bin/bash

echo "🚀 Starting Investment Dashboard..."

# Kill any existing processes
pkill -f "node server/index.js" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null
sleep 2

# Start backend server
echo "📦 Starting backend server on port 5001..."
node server/index.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:5001/api/holdings > /dev/null; then
    echo "✅ Backend server is running!"
else
    echo "❌ Backend server failed to start. Check the logs."
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend on port 3000..."
cd client && npm start &
FRONTEND_PID=$!

echo ""
echo "✨ Investment Dashboard is starting!"
echo "📊 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
