# Kaggle Dataset Setup Guide

## Prerequisites

1. **Kaggle Account**: Create account at https://www.kaggle.com
2. **API Credentials**: Download your `kaggle.json` file

## Setup Steps

### 1. Get Kaggle API Credentials

1. Go to https://www.kaggle.com/account
2. Scroll to "API" section
3. Click "Create New API Token"
4. Download `kaggle.json` file

### 2. Install Kaggle CLI

```bash
pip install kaggle
```

### 3. Configure Credentials

**Option A: Place kaggle.json in ~/.kaggle/**
```bash
mkdir -p ~/.kaggle
mv ~/Downloads/kaggle.json ~/.kaggle/
chmod 600 ~/.kaggle/kaggle.json
```

**Option B: Set environment variables**
```bash
export KAGGLE_USERNAME=your_username
export KAGGLE_KEY=your_api_key
```

### 4. Download Dataset

```bash
# Run the download script
./scripts/data/download-kaggle-dataset.sh

# Or manually:
cd data/kaggle-premier-league
kaggle datasets download -d samoilovmikhail/all-premier-league-team-and-players-1992-2024
unzip all-premier-league-team-and-players-1992-2024.zip
```

## Dataset Information

- **Dataset**: All Premier League team and players (1992-2024)
- **Author**: Mikhail Samoilov
- **URL**: https://www.kaggle.com/datasets/samoilovmikhail/all-premier-league-team-and-players-1992-2024
- **Size**: ~50MB
- **Format**: CSV and JSON files
- **Coverage**: Complete Premier League history (1992-2024)

## Expected Structure

```
data/kaggle-premier-league/
├── clubs.csv                    # Team information
├── DATA_CSV/                    # Season data in CSV format
│   ├── Season_1992/
│   ├── Season_1993/
│   └── ...
└── DATA_JSON/                   # Same data in JSON format
    ├── Season_1992/
    ├── Season_1993/
    └── ...
```

## Next Steps

After download completes, run the import script:

```bash
node scripts/data/import-kaggle-squads.js
```

This will import all historical squad data into the PremStats database.