#!/bin/bash
URL="https://project-storage-starter.onrender.com"
echo "Testing $URL..."

echo "1. Testing homepage..."
curl -s -o /dev/null -w "%{http_code}" $URL
echo " - Status code"

echo "2. Testing API..."
curl -s $URL/api/files | head -5

echo "3. Testing file upload..."
echo "Test content" > test-file.txt
curl -X POST -F "files=@test-file.txt" $URL/api/upload 2>/dev/null | head -5

echo "✅ Test complete!"
