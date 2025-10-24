#!/bin/bash

# Docker Build Script for PACE Insurance
# This script builds Docker images for the application

set -e

echo "🐳 Building Docker images for PACE Insurance..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}[DOCKER]${NC} $1"
}

# Configuration
SERVER_IMAGE_NAME="pace-insurance-server"
WEBSITE_IMAGE_NAME="pace-insurance-website"
TAG="latest"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Build the applications first
print_header "Building applications..."
npm run build

# Build server Docker image
print_header "Building server Docker image..."
cd server
docker build -t $SERVER_IMAGE_NAME:$TAG .
cd ..

print_status "Server image built: $SERVER_IMAGE_NAME:$TAG"

# Build website Docker image (if needed)
print_header "Building website Docker image..."
cd pace-website
docker build -t $WEBSITE_IMAGE_NAME:$TAG .
cd ..

print_status "Website image built: $WEBSITE_IMAGE_NAME:$TAG"

# List built images
print_header "Built Docker images:"
docker images | grep pace-insurance

print_status "Docker build completed!"
print_status ""
print_status "To run the server:"
print_status "  docker run -p 3000:3000 $SERVER_IMAGE_NAME:$TAG"
print_status ""
print_status "To run the website:"
print_status "  docker run -p 5173:5173 $WEBSITE_IMAGE_NAME:$TAG"
print_status ""
print_status "To run with docker-compose:"
print_status "  docker-compose up"
