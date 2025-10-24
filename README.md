# PACE Insurance - Full Stack Application

A comprehensive insurance platform built with Vue.js frontend and Express.js backend, designed for Azure Web App deployment.

## 🏗️ Project Structure

```
pace-insurance-monorepo/
├── pace-website/          # Vue.js frontend application
├── server/               # Express.js backend API
├── package.json          # Root monorepo configuration
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

2. **Development mode (runs both frontend and backend):**
   ```bash
   npm run dev
   ```

3. **Individual services:**
   ```bash
   # Frontend only
   npm run dev:website
   
   # Backend only
   npm run dev:server
   ```

## 📦 Available Scripts

### Monorepo Commands
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both applications
- `npm run start` - Start production server
- `npm run test` - Run tests for both applications
- `npm run lint` - Lint both applications
- `npm run clean` - Clean build artifacts

### Individual Service Commands
- `npm run dev:website` - Start Vue.js frontend
- `npm run dev:server` - Start Express.js backend
- `npm run build:website` - Build Vue.js frontend
- `npm run build:server` - Build Express.js backend

## 🌐 API Endpoints

### Health Check
- `GET /health` - Server health status

### API Routes
- `GET /api/status` - API status
- `GET /api/insurance/types` - Available insurance types
- `GET /api/insurance/quotes` - Quote generation endpoint

## 🚀 Azure Deployment

### Prerequisites
- Azure CLI installed
- Azure subscription
- Azure Web App created

### Deployment Options

#### Option 1: Azure CLI
```bash
# Build the application
npm run build

# Deploy to Azure Web App
az webapp deployment source config-zip \
  --resource-group <your-resource-group> \
  --name <your-app-name> \
  --src server.zip
```

#### Option 2: Azure DevOps Pipeline
The project includes `azure-pipelines.yml` for automated CI/CD deployment.

#### Option 3: Docker Deployment
```bash
# Build Docker image
cd server
docker build -t pace-insurance-server .

# Deploy to Azure Container Instances or Azure Web App for Containers
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.com
```

### Azure Web App Settings

Configure these application settings in Azure:

- `NODE_ENV`: production
- `PORT`: 8080 (Azure default)
- `FRONTEND_URL`: Your frontend URL for CORS

## 🛠️ Development

### Frontend (Vue.js)
- Located in `pace-website/`
- Uses Vite for development and building
- Vue 3 with TypeScript
- Pinia for state management

### Backend (Express.js)
- Located in `server/`
- TypeScript with Express
- CORS enabled for frontend communication
- Helmet for security
- Morgan for logging

## 📁 File Structure

### Server Structure
```
server/
├── src/
│   ├── index.ts           # Main server file
│   ├── middleware/        # Custom middleware
│   └── routes/           # API routes
├── package.json
├── tsconfig.json
├── Dockerfile
├── web.config           # Azure IIS configuration
└── .deployment          # Azure deployment config
```

### Frontend Structure
```
pace-website/
├── src/
│   ├── components/       # Vue components
│   ├── views/          # Page views
│   ├── router/         # Vue Router
│   └── stores/         # Pinia stores
├── package.json
└── vite.config.ts
```

## 🔒 Security

- Helmet.js for security headers
- CORS configuration
- Environment variable validation
- Error handling middleware

## 📊 Monitoring

- Health check endpoint: `/health`
- Request logging with Morgan
- Error tracking and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is proprietary software for PACE Insurance.
