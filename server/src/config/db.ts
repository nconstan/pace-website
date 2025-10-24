import pkg from '@prisma/client';

const { PrismaClient } = pkg;

declare global {
  var prisma: InstanceType<typeof PrismaClient> | undefined;  // Use InstanceType for the instance type
  }
  const prisma: InstanceType<typeof PrismaClient> =  // Use InstanceType here too
  global.prisma ||
  new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
  }
  export default prisma;