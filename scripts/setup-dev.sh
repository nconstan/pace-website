#!/bin/bash

# Development Setup Script for PACE Insurance
# This script sets up the development environment

set -e

echo "🛠️ Setting up PACE Insurance development environment..."

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
    echo -e "${BLUE}[SETUP]${NC} $1"
}

# Check Node.js version
print_header "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20.x or higher."
    exit 1
fi

NODE_VERSION=$(node --version)
print_status "Node.js version: $NODE_VERSION"

# Check npm version
print_header "Checking npm version..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
fi

NPM_VERSION=$(npm --version)
print_status "npm version: $NPM_VERSION"

# Install root dependencies
print_header "Installing root dependencies..."
npm install

# Install server dependencies
print_header "Installing server dependencies..."
cd server
npm install
cd ..

# Install website dependencies
print_header "Installing website dependencies..."
cd pace-website
npm install
cd ..

# Create environment files
print_header "Setting up environment files..."

# Server environment
if [ ! -f "server/.env" ]; then
    print_status "Creating server/.env file..."
    cp server/env.example server/.env
    print_warning "Please update server/.env with your configuration"
else
    print_status "server/.env already exists"
fi

# Make scripts executable
print_header "Making scripts executable..."
chmod +x scripts/*.sh

print_status "Development environment setup completed!"
print_status ""
print_status "Next steps:"
print_status "1. Update server/.env with your configuration"
print_status "2. Run 'npm run dev' to start both frontend and backend"
print_status "3. Frontend will be available at http://localhost:5173"
print_status "4. Backend will be available at http://localhost:3000"
print_status "5. Health check: http://localhost:3000/health"
print_status ""
print_status "Available commands:"
print_status "  npm run dev          - Start both frontend and backend"
print_status "  npm run dev:server  - Start only backend"
print_status "  npm run dev:website - Start only frontend"
print_status "  npm run build       - Build both applications"
print_status "  npm run test        - Run tests"
print_status "  npm run lint        - Run linting"
