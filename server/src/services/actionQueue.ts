import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

const prisma = new PrismaClient();

// Simple scheduler using setInterval instead of pg-boss
let schedulerInterval: NodeJS.Timeout | null = null;

// Command registry - maps command names to their execution functions
const commandRegistry: Record<string, (data: any) => Promise<void>> = {
    sendReminderEmail: sendReminderEmail,
    sendReports: sendReports,
    processClaims: processClaims,
    generateMonthlyReport: generateMonthlyReport,
    cleanupExpiredSessions: cleanupExpiredSessions,
    // Add more commands here as needed
};

// Simple error logging

// Simple logging for command completion

/**
 * Initialize the action queue system
 */
export async function initializeActionQueue() {
    try {
        console.log('Initializing action queue system...');
        
        // Start the command processor worker
        await startCommandProcessor();
        
        console.log('Action queue system initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize action queue:', error);
        console.log('Server will continue without action queue functionality');
        // Don't throw error - let server continue without action queue
    }
}

/**
 * Schedule the daily command processor to run at 12:00 AM every day
 */
async function scheduleDailyCommandProcessor() {
    // This function is no longer needed with the interval-based approach
    console.log('Using interval-based command processor');
}

/**
 * Start the command processor worker
 */
async function startCommandProcessor() {
    try {
        // Start a simple interval-based processor that checks every hour
        schedulerInterval = setInterval(async () => {
            try {
                await processDailyCommands();
            } catch (error) {
                console.error('Error in scheduled command processor:', error);
            }
        }, 60 * 60 * 1000); // Check every hour
        
        // Also run immediately on startup
        await processDailyCommands();
        
        console.log('Command processor worker started');
    } catch (error) {
        console.error('Failed to start command processor worker:', error);
        throw error;
    }
}

/**
 * Process all commands scheduled for today
 */
async function processDailyCommands() {
    console.log('Starting daily command processing...');
    
    try {
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Find all commands for today
        const pendingCommands = await (prisma as any).action_queue.findMany({
            where: {
                run_date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Next day
                }
            },
            orderBy: {
                created_at: 'asc'
            }
        });
        
        console.log(`Found ${pendingCommands.length} commands to process`);
        
        // Process each command
        for (const command of pendingCommands) {
            await processCommand(command);
        }
        
        console.log('Daily command processing completed');
        
    } catch (error) {
        console.error('Error processing daily commands:', error);
        throw error;
    }
}

/**
 * Process a single command
 */
async function processCommand(command: any) {
    console.log(`Processing command: ${command.command} (ID: ${command.id})`);
    
    try {
        // Get the command function from registry
        const commandFunction = commandRegistry[command.command];
        
        if (!commandFunction) {
            throw new Error(`Unknown command: ${command.command}`);
        }
        
        // Execute the command
        await commandFunction(command.data || {});
        
        console.log(`Command ${command.command} completed successfully`);
        
        // Handle post-execution logic
        if (command.repeating && command.interval) {
            // Update the run_date for repeating commands
            const newRunDate = calculateNextRunDate(command.run_date, command.interval);
            await (prisma as any).action_queue.update({
                where: { id: command.id },
                data: { run_date: newRunDate }
            });
            console.log(`Repeating command rescheduled for ${newRunDate.toISOString()}`);
        } else {
            // Delete non-repeating commands after completion
            await (prisma as any).action_queue.delete({
                where: { id: command.id }
            });
            console.log(`Non-repeating command deleted after completion`);
        }
        
    } catch (error) {
        console.error(`Command ${command.command} failed:`, error);
        throw error;
    }
}

/**
 * Add a command to the action queue
 */
export async function scheduleCommand(
    command: string, 
    runDate: Date, 
    data?: any, 
    options?: {
        repeating?: boolean;
        interval?: string;
    }
) {
    try {
        // Validate command exists
        if (!commandRegistry[command]) {
            throw new Error(`Unknown command: ${command}`);
        }
        
        // Validate interval if repeating
        if (options?.repeating && options?.interval) {
            // Test the interval format
            calculateNextRunDate(runDate, options.interval);
        }
        
        const action = await (prisma as any).action_queue.create({
            data: {
                command,
                run_date: runDate,
                data: data || {},
                repeating: options?.repeating || false,
                interval: options?.interval || null
            }
        });
        
        const scheduleType = options?.repeating ? 'repeating' : 'one-time';
        console.log(`${scheduleType} command ${command} scheduled for ${runDate.toISOString()}`);
        if (options?.repeating && options?.interval) {
            console.log(`Repeating every: ${options.interval}`);
        }
        
        return action;
        
    } catch (error) {
        console.error('Failed to schedule command:', error);
        throw error;
    }
}

/**
 * Get all scheduled commands
 */
export async function getScheduledCommands(filters?: {
    runDate?: Date;
    command?: string;
}) {
    try {
        const where: any = {};
        
        if (filters?.runDate) {
            const startOfDay = new Date(filters.runDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
            
            where.run_date = {
                gte: startOfDay,
                lt: endOfDay
            };
        }
        
        if (filters?.command) {
            where.command = filters.command;
        }
        
        return await (prisma as any).action_queue.findMany({
            where,
            orderBy: {
                run_date: 'asc'
            }
        });
        
    } catch (error) {
        console.error('Failed to get scheduled commands:', error);
        throw error;
    }
}

/**
 * Cancel a scheduled command
 */
export async function cancelCommand(commandId: string) {
    try {
        const command = await (prisma as any).action_queue.findUnique({
            where: { id: BigInt(commandId) }
        });
        
        if (!command) {
            throw new Error('Command not found');
        }
        
        // Delete the command since we don't have status tracking
        await (prisma as any).action_queue.delete({
            where: { id: BigInt(commandId) }
        });
        
        console.log(`Command ${commandId} cancelled`);
        
    } catch (error) {
        console.error('Failed to cancel command:', error);
        throw error;
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate the next run date based on interval
 */
function calculateNextRunDate(currentDate: Date, interval: string): Date {
    const date = new Date(currentDate);
    
    // Parse interval (e.g., "1 month", "2 weeks", "5 days")
    const match = interval.match(/^(\d+)\s+(day|week|month|year)s?$/i);
    
    if (!match) {
        throw new Error(`Invalid interval format: ${interval}. Expected format: "1 day", "2 weeks", "1 month", etc.`);
    }
    
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
        case 'day':
        case 'days':
            date.setDate(date.getDate() + amount);
            break;
            
        case 'week':
        case 'weeks':
            date.setDate(date.getDate() + (amount * 7));
            break;
            
        case 'month':
        case 'months':
            // Handle month addition carefully to avoid date overflow
            const currentMonth = date.getMonth();
            const currentYear = date.getFullYear();
            const newMonth = currentMonth + amount;
            
            // Calculate new year and month
            const newYear = currentYear + Math.floor(newMonth / 12);
            const finalMonth = newMonth % 12;
            
            // Set the new date, but handle day overflow (e.g., Jan 31 + 1 month = Feb 28/29)
            const originalDay = date.getDate();
            date.setFullYear(newYear, finalMonth, 1);
            
            // Get the last day of the target month
            const lastDayOfMonth = new Date(newYear, finalMonth + 1, 0).getDate();
            
            // Set the day, but don't exceed the last day of the month
            date.setDate(Math.min(originalDay, lastDayOfMonth));
            break;
            
        case 'year':
        case 'years':
            date.setFullYear(date.getFullYear() + amount);
            break;
            
        default:
            throw new Error(`Unsupported interval unit: ${unit}`);
    }
    
    return date;
}

// ============================================================================
// COMMAND IMPLEMENTATIONS
// ============================================================================

/**
 * Send reminder email command
 */
async function sendReminderEmail(data: any) {
    console.log('Processing reminder email for claim:', data.claim_id);
    
    try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        
        // Get the claim details
        const claim = await prisma.claims_details.findUnique({
            where: { id: BigInt(data.claim_id) },
            include: {
                applicants: true,
                policies: true
            }
        });
        
        if (!claim) {
            console.log(`Claim ${data.claim_id} not found, skipping reminder`);
            return;
        }
        
        // Check if claim is completed (active = 0)
        if (claim.active === 0) {
            console.log(`Claim ${data.claim_id} is completed, skipping reminder`);
            return;
        }
        
        // Get the most recent update date
        const lastUpdate = claim.last_update || claim.created_at;
        const daysSinceUpdate = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 1)); //1000 * 60 * 60 * 24
        
        console.log(`Claim ${data.claim_id} last updated ${daysSinceUpdate} days ago`);
        
        if (daysSinceUpdate >= 7) {
            // Send reminder email
            console.log(`Sending reminder email for claim ${data.claim_id}`);
            
            // Send to primary email if available
            if (data.email_1) {
                await sendEmailToClaimant(data.email_1, claim, 'primary');
            }
            
            // Send to secondary email if available
            if (data.email_2) {
                await sendEmailToClaimant(data.email_2, claim, 'secondary');
            }
            
            console.log(`Reminder emails sent for claim ${data.claim_id}`);
        } 

        // Schedule for 7 days since last update
        const nextReminderDate = new Date(lastUpdate.getTime() + (7 * 24 * 60 * 60 * 1000));
        console.log(`Scheduling next reminder for claim ${data.claim_id} on ${nextReminderDate.toISOString()}`);
        
        // Schedule the next reminder
        await scheduleCommand(
            'sendReminderEmail',
            nextReminderDate,
            {
                claim_id: data.claim_id,
                email_1: data.email_1,
                email_2: data.email_2
            }
        );
        
        
    } catch (error) {
        console.error('Error processing reminder email:', error);
        throw error;
    }
}

/**
 * Send email to claimant about their claim TODO actual email sending
 */
async function sendEmailToClaimant(email: string, claim: any, emailType: 'primary' | 'secondary') {
    try {
        // TODO: Implement actual email sending logic
        // This could integrate with your existing email service (e.g., SendGrid, AWS SES, etc.)
        
        const subject = `Claim Reminder - Claim #${claim.id}`;
        const body = `
            Dear ${claim.applicants?.first_name_1 || 'Valued Customer'},

            This is a friendly reminder that your claim #${claim.id} is still in progress and requires your attention.

            Claim Details:
            - Claim ID: ${claim.id}
            - Policy ID: ${claim.from_policy}
            - Created: ${claim.created_at.toLocaleDateString()}
            - Last Updated: ${claim.last_update ? claim.last_update.toLocaleDateString() : 'Never'}

            Please log into your account to check the status and upload any required documents.

            If you have any questions, please contact our support team.

            Best regards,
            Principal Asset Insurance Team
        `;
        
        console.log(`Sending ${emailType} reminder email to ${email}:`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${body}`);
        
        // TODO: Replace with actual email sending implementation
        // await sendEmail(email, subject, body);
        
    } catch (error) {
        console.error(`Failed to send ${emailType} email to ${email}:`, error);
        throw error;
    }
}

/**
 * Send reports command
 */
async function sendReports(data: any) {
    console.log('Sending reports to:', data.email);
    
    // TODO: Implement actual report generation and sending
    // This could generate PDF reports and email them
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('Reports sent successfully');
}

/**
 * Process claims command
 */
async function processClaims(data: any) {
    console.log('Processing claims...');
    
    // TODO: Implement claims processing logic
    // This could process pending claims, send notifications, etc.
    
    // Simulate claims processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Claims processed successfully');
}

/**
 * Generate monthly report command
 */
async function generateMonthlyReport(data: any) {
    console.log('Generating monthly report...');
    
    // TODO: Implement monthly report generation
    // This could aggregate data and create comprehensive reports
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('Monthly report generated successfully');
}

/**
 * Cleanup expired sessions command
 */
async function cleanupExpiredSessions(data: any) {
    console.log('Cleaning up expired sessions...');
    
    // TODO: Implement session cleanup logic
    // This could remove expired JWT tokens, clean up temporary data, etc.
    
    // Simulate cleanup
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Expired sessions cleaned up successfully');
}

/**
 * Register a new command
 */
export function registerCommand(name: string, handler: (data: any) => Promise<void>) {
    commandRegistry[name] = handler;
    console.log(`Command '${name}' registered`);
}

/**
 * Get all available commands
 */
export function getAvailableCommands(): string[] {
    return Object.keys(commandRegistry);
}

/**
 * Shutdown the action queue system
 */
export async function shutdownActionQueue() {
    try {
        console.log('Shutting down action queue...');
        
        // Clear the interval
        if (schedulerInterval) {
            clearInterval(schedulerInterval);
            schedulerInterval = null;
        }
        
        console.log('Action queue system shutdown');
    } catch (error) {
        console.error('Error shutting down action queue:', error);
        throw error;
    }
}

// Action queue system is now using simple interval-based scheduling