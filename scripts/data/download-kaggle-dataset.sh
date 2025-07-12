#!/bin/bash

# Download Kaggle Premier League dataset
# Dataset: "All Premier League team and players (1992-2024)"

set -e

echo "📊 Downloading Kaggle Premier League Dataset..."
echo "Dataset: samoilovmikhail/all-premier-league-team-and-players-1992-2024"

# Check if kaggle CLI is installed
if ! command -v kaggle &> /dev/null; then
    echo "❌ Kaggle CLI not found. Installing..."
    pip install kaggle
fi

# Create data directory
mkdir -p data/kaggle-premier-league

# Download dataset
echo "⬇️  Downloading dataset (this may take a few minutes)..."
cd data/kaggle-premier-league

kaggle datasets download -d samoilovmikhail/all-premier-league-team-and-players-1992-2024

# Extract the dataset
echo "📂 Extracting dataset..."
unzip -o all-premier-league-team-and-players-1992-2024.zip

# Clean up zip file
rm all-premier-league-team-and-players-1992-2024.zip

echo "✅ Dataset downloaded and extracted to data/kaggle-premier-league/"

# Show directory structure
echo "📁 Dataset structure:"
ls -la
if [ -d "DATA_CSV" ]; then
    echo "📁 CSV data structure:"
    ls DATA_CSV/ | head -10
fi

echo ""
echo "🚀 Ready to import! Run: node scripts/data/import-kaggle-squads.js"