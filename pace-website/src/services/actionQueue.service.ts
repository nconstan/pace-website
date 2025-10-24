import api from './api/axiosInstance'

export interface ScheduledCommand {
    id: string;
    created_at: string;
    run_date: string;
    command: string;
    data?: any;
    repeating: boolean;
    interval?: string;
}

export interface CommandStats {
    totalCommands: number;
    recentCommands: number;
    todayCommands: number;
    availableCommands: number;
}

export interface ScheduleCommandData {
    command: string;
    runDate: string;
    data?: any;
    repeating?: boolean;
    interval?: string;
}

class ActionQueueService {
    /**
     * Get all available commands
     */
    async getCommands(): Promise<{ commands: string[] }> {
        const response = await api.get('/action-queue/commands');
        return response.data;
    }

    /**
     * Schedule a new command
     */
    async scheduleCommand(data: ScheduleCommandData): Promise<{ message: string; command: ScheduledCommand }> {
        const response = await api.post('/action-queue/schedule', data);
        return response.data;
    }

    /**
     * Get scheduled commands with optional filters
     */
    async getScheduledCommands(filters?: {
        runDate?: string;
        command?: string;
    }): Promise<{ commands: ScheduledCommand[] }> {
        const params = new URLSearchParams();
        if (filters?.runDate) params.append('runDate', filters.runDate);
        if (filters?.command) params.append('command', filters.command);

        const response = await api.get(`/action-queue/scheduled?${params.toString()}`);
        return response.data;
    }

    /**
     * Cancel a scheduled command
     */
    async cancelCommand(commandId: string): Promise<{ message: string }> {
        const response = await api.delete(`/action-queue/cancel/${commandId}`);
        return response.data;
    }

    /**
     * Get command statistics
     */
    async getCommandStats(): Promise<CommandStats> {
        const response = await api.get('/action-queue/stats');
        return response.data;
    }

    /**
     * Register a new command (admin only)
     */
    async registerCommand(name: string, handler: Function): Promise<{ message: string; command: string }> {
        const response = await api.post('/action-queue/register', {
            name,
            handler
        });
        return response.data;
    }

    /**
     * Get commands for today
     */
    async getTodayCommands(): Promise<{ commands: ScheduledCommand[] }> {
        const today = new Date().toISOString().split('T')[0];
        return this.getScheduledCommands({ runDate: today });
    }

    /**
     * Get all commands
     */
    async getAllCommands(): Promise<{ commands: ScheduledCommand[] }> {
        return this.getScheduledCommands();
    }

    /**
     * Schedule a one-time command
     */
    async scheduleOneTimeCommand(command: string, runDate: string, data?: any): Promise<{ message: string; command: ScheduledCommand }> {
        return this.scheduleCommand({
            command,
            runDate,
            data,
            repeating: false
        });
    }

    /**
     * Schedule a repeating command
     */
    async scheduleRepeatingCommand(command: string, runDate: string, interval: string, data?: any): Promise<{ message: string; command: ScheduledCommand }> {
        return this.scheduleCommand({
            command,
            runDate,
            data,
            repeating: true,
            interval
        });
    }

    /**
     * Schedule a daily command
     */
    async scheduleDailyCommand(command: string, runDate: string, data?: any): Promise<{ message: string; command: ScheduledCommand }> {
        return this.scheduleRepeatingCommand(command, runDate, '1 day', data);
    }

    /**
     * Schedule a weekly command
     */
    async scheduleWeeklyCommand(command: string, runDate: string, data?: any): Promise<{ message: string; command: ScheduledCommand }> {
        return this.scheduleRepeatingCommand(command, runDate, '1 week', data);
    }

    /**
     * Schedule a monthly command
     */
    async scheduleMonthlyCommand(command: string, runDate: string, data?: any): Promise<{ message: string; command: ScheduledCommand }> {
        return this.scheduleRepeatingCommand(command, runDate, '1 month', data);
    }
}

export default new ActionQueueService();
