import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.js';
import { 
    scheduleCommand, 
    getScheduledCommands, 
    cancelCommand,
    getAvailableCommands,
    registerCommand
} from '../services/actionQueue.js';

/**
 * Get all available commands
 */
export const getCommands = asyncHandler(async (req: any, res: Response): Promise<void> => {
    try {
        const commands = getAvailableCommands();
        res.json({ commands });
    } catch (error) {
        console.error('Error getting commands:', error);
        res.status(500).json({ message: 'Failed to get commands' });
    }
});

/**
 * Schedule a new command
 */
export const scheduleNewCommand = asyncHandler(async (req: any, res: Response): Promise<void> => {
    try {
        const { command, runDate, data, repeating, interval } = req.body;

        if (!command) {
            res.status(400).json({ message: 'Command is required' });
            return;
        }

        if (!runDate) {
            res.status(400).json({ message: 'Run date is required' });
            return;
        }

        if (repeating && !interval) {
            res.status(400).json({ message: 'Interval is required for repeating commands' });
            return;
        }

        const options = {
            repeating: repeating || false,
            interval: interval || undefined
        };

        const scheduledCommand = await scheduleCommand(
            command,
            new Date(runDate),
            data,
            options
        );

        res.status(201).json({
            message: 'Command scheduled successfully',
            command: scheduledCommand
        });

    } catch (error) {
        console.error('Error scheduling command:', error);
        res.status(500).json({ 
            message: error instanceof Error ? error.message : 'Failed to schedule command' 
        });
    }
});

/**
 * Get scheduled commands with optional filters
 */
export const getScheduled = asyncHandler(async (req: any, res: Response): Promise<void> => {
    try {
        const { runDate, command } = req.query;

        const filters: any = {};
        if (runDate) filters.runDate = new Date(runDate as string);
        if (command) filters.command = command;

        const commands = await getScheduledCommands(filters);

        res.json({ commands });

    } catch (error) {
        console.error('Error getting scheduled commands:', error);
        res.status(500).json({ message: 'Failed to get scheduled commands' });
    }
});

/**
 * Cancel a scheduled command
 */
export const cancelScheduledCommand = asyncHandler(async (req: any, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ message: 'Command ID is required' });
            return;
        }

        await cancelCommand(id);

        res.json({ message: 'Command cancelled successfully' });

    } catch (error) {
        console.error('Error cancelling command:', error);
        res.status(500).json({ 
            message: error instanceof Error ? error.message : 'Failed to cancel command' 
        });
    }
});

/**
 * Get command statistics
 */
export const getCommandStats = asyncHandler(async (req: any, res: Response): Promise<void> => {
    try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();

        // Get recent commands (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentCommands = await (prisma as any).action_queue.count({
            where: {
                created_at: {
                    gte: sevenDaysAgo
                }
            }
        });

        // Get today's commands
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayCommands = await (prisma as any).action_queue.count({
            where: {
                run_date: {
                    gte: today,
                    lt: tomorrow
                }
            }
        });

        // Get total commands
        const totalCommands = await (prisma as any).action_queue.count();

        const stats = {
            totalCommands,
            recentCommands,
            todayCommands,
            availableCommands: getAvailableCommands().length
        };

        res.json(stats);

    } catch (error) {
        console.error('Error getting command stats:', error);
        res.status(500).json({ message: 'Failed to get command statistics' });
    }
});

/**
 * Register a new command (admin only)
 */
export const registerNewCommand = asyncHandler(async (req: any, res: Response): Promise<void> => {
    try {
        const { name, handler } = req.body;

        if (!name || !handler) {
            res.status(400).json({ message: 'Command name and handler are required' });
            return;
        }

        // Validate that handler is a function
        if (typeof handler !== 'function') {
            res.status(400).json({ message: 'Handler must be a function' });
            return;
        }

        registerCommand(name, handler);

        res.json({ 
            message: 'Command registered successfully',
            command: name
        });

    } catch (error) {
        console.error('Error registering command:', error);
        res.status(500).json({ 
            message: error instanceof Error ? error.message : 'Failed to register command' 
        });
    }
});
