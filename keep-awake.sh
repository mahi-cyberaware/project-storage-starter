#!/bin/bash
URL="https://project-storage-starter.onrender.com"
echo "Keeping $URL awake..."

while true; do
    curl -s -o /dev/null $URL
    echo "Pinged at $(date)"
    sleep 300  # 5 minutes
done
