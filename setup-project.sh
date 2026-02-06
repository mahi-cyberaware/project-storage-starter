#!/bin/bash
# Save as setup-project.sh

echo "🚀 Setting up Project Storage System..."

# Create all directories
mkdir -p public/{css,js} uploads

# Create all files
touch server.js package.json render.yaml .gitignore README.md TERMUX_SETUP.md start.sh
touch public/index.html public/upload.html public/files.html public/about.html public/contact.html
touch public/css/style.css public/css/nav.css public/css/home.css public/css/upload.css public/css/files.css public/css/about-contact.css
touch public/js/api.js public/js/nav.js public/js/home.js public/js/upload.js public/js/files.js public/js/about-contact.js
touch uploads/.gitkeep

echo "✅ All files created!"
echo ""
echo "📁 Project structure created:"
find . -maxdepth 2 -type f -name "*.js" -o -name "*.css" -o -name "*.html" -o -name "*.json" -o -name "*.yaml" | sort
echo ""
echo "📝 Next steps:"
echo "1. Copy the code above into each file"
echo "2. Run: npm install"
echo "3. Start server: npm start"
echo "4. Open: http://localhost:3000"
