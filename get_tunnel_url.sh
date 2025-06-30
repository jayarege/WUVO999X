#\!/bin/bash
# Check for Expo tunnel URL in common locations
if [ -f .expo/README.md ]; then
    echo "=== Expo Tunnel URL ==="
    grep -o 'exp://[^"]*' .expo/README.md || echo "URL not found in README"
fi

# Check Expo cache for tunnel info
if [ -d .expo ]; then
    echo "=== Expo Directory Contents ==="
    ls -la .expo/
    find .expo -name "*.json" -exec grep -l "tunnel\ < /dev/null | exp://" {} \; 2>/dev/null || echo "No tunnel info found"
fi

# Try to get from expo CLI
echo "=== Trying expo status ==="
npx expo --version 2>/dev/null && echo "Expo CLI working"
