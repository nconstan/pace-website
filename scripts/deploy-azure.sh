#!/bin/bash

# Azure Deployment Script for PACE Insurance
# This script builds and deploys the application to Azure Web App

set -e

echo "🚀 Starting Azure deployment for PACE Insurance..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is logged in to Azure
if ! az account show &> /dev/null; then
    print_error "Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Configuration (update these values)
RESOURCE_GROUP="pace-insurance-rg"
APP_NAME="pace-insurance-server"
LOCATION="East US"

print_status "Building the application..."

# Install dependencies
print_status "Installing dependencies..."
npm run install:all

# Build the application
print_status "Building server..."
npm run build:server

print_status "Building website..."
npm run build:website

# Create deployment package
print_status "Creating deployment package..."
cd server
zip -r ../deployment.zip . -x "node_modules/*" "*.log" ".env*"

cd ..

# Deploy to Azure Web App
print_status "Deploying to Azure Web App..."

# Check if resource group exists, create if not
if ! az group show --name $RESOURCE_GROUP &> /dev/null; then
    print_status "Creating resource group: $RESOURCE_GROUP"
    az group create --name $RESOURCE_GROUP --location "$LOCATION"
fi

# Check if web app exists, create if not
if ! az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    print_status "Creating Azure Web App: $APP_NAME"
    az webapp create \
        --resource-group $RESOURCE_GROUP \
        --plan pace-insurance-plan \
        --name $APP_NAME \
        --runtime "NODE:20-lts"
fi

# Deploy the application
print_status "Deploying application..."
az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --src deployment.zip

# Configure app settings
print_status "Configuring app settings..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings \
        NODE_ENV=production \
        PORT=8080 \
        WEBSITE_NODE_DEFAULT_VERSION=20-lts

# Get the app URL
APP_URL=$(az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query "defaultHostName" -o tsv)

print_status "Deployment completed successfully!"
print_status "Application URL: https://$APP_URL"
print_status "Health check: https://$APP_URL/health"

# Clean up
rm -f deployment.zip

print_status "Deployment script completed!"
