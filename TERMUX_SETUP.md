# Termux Setup Instructions

## 1. Install required packages
pkg update && pkg upgrade
pkg install nodejs-lts git -y

## 2. Clone and setup project
git clone https://github.com/mahi-cyberaware/project-storage-starter.git
cd project-storage-starter
npm install

## 3. Start the server
# For development with auto-restart:
npm run dev

# For production:
npm start

# Or use the start script:
./start.sh

## 4. Access the application
- On your phone: http://localhost:3000
- On local network: http://192.0.0.4:3000
  (Get IP with: ifconfig | grep 'inet ')

## 5. Port forwarding (for external access)
# In Termux:
pkg install termux-api
termux-wifi-connectioninfo
# Note: Requires port forwarding on your router
