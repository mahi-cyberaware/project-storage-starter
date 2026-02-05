#!/bin/bash
echo "Starting Project Storage Server..."
echo "Access on: http://localhost:3000"
echo "For local network: http://$(ifconfig | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | head -n1):3000"
node server.js
