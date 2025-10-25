import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Environment variables interface
interface EnvironmentVariables {
  // Database (Supabase)
  DATABASE_URL: string;
  DIRECT_URL?: string;
  SUPABASE_URL: string;
  SUPABASE_KEY?: string;
  
  // Supabase Project (for storage)
  SUPABASE_PROJECT_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  
  // JWT
  JWT_SECRET: string;
  
  // Server
  PORT: string;
  NODE_ENV: string;

  //email
  EMAIL_CLIENT_SECRET: string;
}

// Validate required environment variables
const requiredEnvVars: (keyof EnvironmentVariables)[] = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_PROJECT_URL',
  'SUPABASE_ANON_KEY',
  'JWT_SECRET',
  'PORT',
  'EMAIL_CLIENT_SECRET'
];

// Check for missing required environment variables
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Export environment variables with type safety
export const env: EnvironmentVariables = {
  DATABASE_URL: process.env.DATABASE_URL!,
  DIRECT_URL: process.env.DIRECT_URL || '',
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
  SUPABASE_PROJECT_URL: process.env.SUPABASE_PROJECT_URL!,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  JWT_SECRET: process.env.JWT_SECRET!,
  PORT: process.env.PORT || '3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  EMAIL_CLIENT_SECRET: process.env.EMAIL_CLIENT_SECRET!
};

// Export individual variables for convenience
export const {
  SUPABASE_URL,
  SUPABASE_KEY,
  SUPABASE_PROJECT_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  JWT_SECRET,
  PORT,
  NODE_ENV,
  EMAIL_CLIENT_SECRET
} = env;

// Export environment check helpers
export const isDevelopment = NODE_ENV === 'development';
export const isProduction = NODE_ENV === 'production';
export const isTest = NODE_ENV === 'test';
