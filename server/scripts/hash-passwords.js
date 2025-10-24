const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function hashPasswords() {
    try {
        console.log('Starting password hashing...');
        
        // Get all accounts with plain text passwords (you might want to filter this)
        const accounts = await prisma.accounts.findMany({
            where: {
                // Add a condition to identify accounts that need hashing
                // For example, you might have a flag or specific pattern
                password: {
                    not: null
                }
            }
        });
        
        console.log(`Found ${accounts.length} accounts to process`);
        
        for (const account of accounts) {
            // Skip if password is already hashed (starts with $argon2id$)
            if (account.password && account.password.startsWith('$argon2id$')) {
                console.log(`Skipping account ${account.username} - already hashed`);
                continue;
            }
            
            // Hash the password
            const hashedPassword = await argon2.hash(account.password, {
                type: argon2.argon2id,
                memoryCost: 2 ** 16, // 64 MiB
                timeCost: 3, // 3 iterations
                parallelism: 1 // 1 thread
            });
            
            // Update the account with hashed password
            await prisma.accounts.update({
                where: { id: account.id },
                data: { password: hashedPassword }
            });
            
            console.log(`Hashed password for account: ${account.username}`);
        }
        
        console.log('Password hashing completed successfully!');
    } catch (error) {
        console.error('Error hashing passwords:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
hashPasswords(); 