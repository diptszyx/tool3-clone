#!/bin/bash
# build-apk.sh

set -e

echo "PWA to APK Builder"
echo "===================="

if ! command -v bubblewrap &> /dev/null; then
    echo "Installing Bubblewrap CLI..."
    npm i -g @bubblewrap/cli
fi

if [ ! -f "twa-manifest.json" ]; then
    echo ""
    echo "First time setup required!"
    read -p "Enter your PWA URL: " PWA_URL

    if [ -z "$PWA_URL" ]; then
        echo "Error: PWA URL required!"
        exit 1
    fi

    echo "Initializing..."
    bubblewrap init --manifest "$PWA_URL/manifest.json"

    echo ""
    echo "IMPORTANT: Edit build.gradle, add: resConfigs \"en\""
    echo "Then run this script again."
    exit 0
fi

echo "Updating project..."
bubblewrap update --manifest=./twa-manifest.json

echo "Building APK..."
bubblewrap build

echo ""
echo "Done! → app-release-signed.apk"