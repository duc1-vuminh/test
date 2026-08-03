import AwsService from "./aws.service";
const mariaSnapData = {
    "repositories": [
        {
            "repository_id": 1,
            "name": "dev",
            "repository_name": "test",
            "repository_url": "testrepository",
            "created_at": "2026-07-27T03:12:42.000Z",
            "updated_at": "2026-07-27T03:12:42.000Z",
            "isHttps": 0,
            "username": "test1",
            "password": "test123456"
        }
    ],
    "tags": [
        {
            "tag_id": 1,
            "name": "test-123",
            "repository_id": 1,
            "created_at": "2026-07-27T03:12:42.000Z",
            "updated_at": "2026-07-27T03:12:42.000Z",
            "has_selected": 1
        }
    ],
    "suites": [
        {
            "suite_id": 1,
            "name": "dev",
            "repository_id": 1,
            "created_at": "2026-07-27T03:14:28.000Z",
            "updated_at": "2026-07-27T03:14:28.000Z"
        }
    ],
    "scenarios": [
        {
            "scenario_id": 1,
            "suite_id": 1,
            "scenario_name": "Scenario 1",
            "scenario_order": -1,
            "created_at": "2026-07-27T03:14:28.000Z",
            "updated_at": "2026-07-27T03:14:28.000Z"
        }
    ],
    "scenarioRuns": [
        {
            "scenario_run_id": 1,
            "scenario_id": 1,
            "tag_id": 1,
            "status": "EXCEPTION",
            "startTime": "2026-07-27T03:14:32.000Z",
            "finishTime": "2026-07-27T03:14:36.000Z",
            "scenario_log": "too many errors\n"
        }
    ],
    "scenarioRunGroups": [
        {
            "scenario_run_group_id": 1,
            "scenario_id": "e826114d-38b3-435e-80f4-4985f19e85f9",
            "scenario_name": "N/A",
            "tag": "N/A\n                             ",
            "repository": "N/A",
            "pass": 1,
            "fail": 0,
            "timeout": 0,
            "result": 1,
            "startTime": "2026-07-26T19:38:34.000Z",
            "finishTime": "2026-07-26T19:38:34.000Z"
        },
        {
            "scenario_run_group_id": 10,
            "scenario_id": "178d7af0-6256-4152-a444-6cdc28122784",
            "scenario_name": "N/A",
            "tag": "N/A\n                             ",
            "repository": "N/A",
            "pass": 1,
            "fail": 0,
            "timeout": 0,
            "result": 1,
            "startTime": "2026-07-26T20:28:08.000Z",
            "finishTime": "2026-07-26T20:28:08.000Z"
        },
        {
            "scenario_run_group_id": 11,
            "scenario_id": "b468eb64-f18d-401e-91be-096aa16be2c8",
            "scenario_name": "N/A",
            "tag": "N/A\n                             ",
            "repository": "N/A",
            "pass": 1,
            "fail": 0,
            "timeout": 0,
            "result": 1,
            "startTime": "2026-07-26T20:32:36.000Z",
            "finishTime": "2026-07-26T20:32:36.000Z"
        },
        {
            "scenario_run_group_id": 12,
            "scenario_id": "1f34936b-f4e6-4a46-9356-6c3f7b71cee8",
            "scenario_name": "N/A",
            "tag": "N/A\n                             ",
            "repository": "N/A",
            "pass": 1,
            "fail": 0,
            "timeout": 0,
            "result": 1,
            "startTime": "2026-07-26T20:37:56.000Z",
            "finishTime": "2026-07-26T20:37:56.000Z"
        },
        {
            "scenario_run_group_id": 13,
            "scenario_id": "3e33527e-83e9-4cf1-ab3d-ab82d40c590c",
            "scenario_name": "N/A",
            "tag": "N/A\n                             ",
            "repository": "N/A",
            "pass": 1,
            "fail": 0,
            "timeout": 0,
            "result": 1,
            "startTime": "2026-07-26T20:41:47.000Z",
            "finishTime": "2026-07-26T20:41:47.000Z"
        },
        {
            "scenario_run_group_id": 14,
            "scenario_id": "dac7323a-db1d-4873-ac97-aff6377897c7",
            "scenario_name": "N/A",
            "tag": "N/A\n                             ",
            "repository": "N/A",
            "pass": 1,
            "fail": 0,
            "timeout": 0,
            "result": 1,
            "startTime": "2026-07-26T20:53:27.000Z",
            "finishTime": "2026-07-26T20:53:27.000Z"
        },
        {
            "scenario_run_group_id": 15,
            "scenario_id": "f5d734a8-675e-4bbb-9c90-9aad8d254f86",
            "scenario_name": "N/A",
            "tag": "N/A\n                             ",
            "repository": "N/A",
            "pass": 1,
            "fail": 0,
            "timeout": 0,
            "result": 1,
            "startTime": "2026-07-26T20:55:39.000Z",
            "finishTime": "2026-07-26T20:55:39.000Z"
        }
    ]
};
const influxData = {
    "status": true,
    "data": [
        {
            "result": "true",
            "table": 0,
            "_start": "2026-04-18T06:44:20.213708987Z",
            "_stop": "2026-07-27T06:44:20.213708987Z",
            "_time": "2026-07-27T06:44:20.066Z",
            "_measurement": "signal",
            "operation": "REQ_READ_SIGNAL",
            "scenarioId": "217b6257-bd49-4a73-bfc7-0ca30a019e1a",
            "scenarioName": "N/A",
            "scenarioRepository": "N/A",
            "scenarioTag": "N/A",
            "system": "Scenario",
            "state": "{\"value\":\"0x0000\"}",
            "equipmentId": "1",
            "id": "dummy_in",
            "name": "ダミー信号",
            "type": "0"
        },
        {
            "result": "true",
            "table": 0,
            "_start": "2026-04-18T06:44:20.213708987Z",
            "_stop": "2026-07-27T06:44:20.213708987Z",
            "_time": "2026-07-27T06:44:20.057Z",
            "_measurement": "signal",
            "operation": "RES_CONFIG",
            "scenarioId": "217b6257-bd49-4a73-bfc7-0ca30a019e1a",
            "scenarioName": "N/A",
            "scenarioRepository": "N/A",
            "scenarioTag": "N/A",
            "system": "WrapperAPI",
            "state": "{\"value\":\"0x0000\"}",
            "equipmentId": "1",
            "id": "dummy_out",
            "name": "ダミー信号",
            "type": "1"
        }]
};
export default class BackupService {
    private static instance: BackupService;
    private schedulerTimer: NodeJS.Timeout | null = null;

    private constructor() {}

    public static getInstance(): BackupService {
        if (!BackupService.instance) {
            BackupService.instance = new BackupService();
        }
        return BackupService.instance;
    }

    // Returns "YYYY-MM-DD" in Tokyo timezone for any Date
    private getTokyoDateString(date: Date): string {
        return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(date);
    }

    // Returns UTC Date boundaries for a full calendar day in Tokyo timezone
    private getTokyoDateRange(dateStr: string): { start: Date; end: Date } {
        const start = new Date(`${dateStr}T00:00:00+09:00`);
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        return { start, end };
    }

    // Returns UTC Date boundaries for today 00:00 JST → now
    private getTodayRangeTokyo(): { start: Date; end: Date } {
        const now = new Date();
        const todayStr = this.getTokyoDateString(now);
        const start = new Date(`${todayStr}T00:00:00+09:00`);
        return { start, end: now };
    }

    // Returns milliseconds until next 00:00 JST
    private getMsUntilTokyoMidnight(): number {
        const now = new Date();
        const todayStr = this.getTokyoDateString(now);
        const todayMidnightJST = new Date(`${todayStr}T00:00:00+09:00`);
        const nextMidnightJST = new Date(todayMidnightJST.getTime() + 24 * 60 * 60 * 1000);
        return nextMidnightJST.getTime() - now.getTime();
    }

    private async buildInfluxSnapshot(start: Date, end: Date, dateLabel: string) {
        //const influxData = await new InfluxService().getInfluxLogByTimeRange(start, end);
        if (!influxData || (Array.isArray(influxData) && influxData.length === 0)) return null;
        return { fileName: `influxdb_${dateLabel}.json`, content: influxData };
    }

    // Feature 5: Backup before stop - backup today's data (00:00 JST to now)
    public async backupBeforeStop(): Promise<{ success: boolean; error?: string }> {
        try {
            console.log("[BACKUP-BEFORE-STOP] Creating instance backup...");
            const now = new Date();
            const todayStr = this.getTokyoDateString(now);
            const { start, end } = this.getTodayRangeTokyo();
            const mariaSnapDataT = {
                fileName: `mariadb_${todayStr}.json`,
                content: mariaSnapData
            }

            const [mariaSnapshot, influxSnapshot] = await Promise.all([
                //new MariaDBService().createDailyBackupData(start, end),
                mariaSnapDataT,
                this.buildInfluxSnapshot(start, end, todayStr),
            ]);

            const files = [mariaSnapshot, influxSnapshot].filter(Boolean);
            if (files.length === 0) {
                console.log("[BACKUP-BEFORE-STOP] No data to backup for today.");
                return { success: true };
            }

            const result = await AwsService.getInstance().uploadToS3(files, "daily-snapshots");
            if (result.success) {
                console.log("[BACKUP-BEFORE-STOP] Backup completed successfully.");
            } else {
                console.error("[BACKUP-BEFORE-STOP] Backup failed.");
            }
            return { success: result.success, error: result.error };
        } catch (err) {
            console.error("[BACKUP-BEFORE-STOP] Error:", err.message);
            return { success: false, error: err.message };
        }
    }

    // Feature 6: Run daily backup for a specific date (targetDate is any point in that Tokyo calendar day)
    public async runDailyBackup(targetDate: Date): Promise<boolean> {
        const dateStr = this.getTokyoDateString(targetDate);
        try {
            console.log(`[DAILY-BACKUP] Running daily backup for ${dateStr} (Tokyo)`);
            const { start, end } = this.getTokyoDateRange(dateStr);
            const mariaSnapDataT = {
                fileName: `mariadb_${dateStr}.json`,
                content: mariaSnapData
            }
            const [mariaSnapshot, influxSnapshot] = await Promise.all([
                //new MariaDBService().createDailyBackupData(start, end),
                mariaSnapDataT,
                this.buildInfluxSnapshot(start, end, dateStr),
            ]);

            const files = [mariaSnapshot, influxSnapshot].filter(Boolean);
            if (files.length === 0) {
                console.log(`[DAILY-BACKUP] No data for ${dateStr}. Marking as complete.`);
                AwsService.getInstance().updateDailyBackupState(dateStr);
                return true;
            }

            const result = await AwsService.getInstance().uploadToS3(files, "daily-snapshots");
            if (result.success) {
                AwsService.getInstance().updateDailyBackupState(dateStr);
                console.log(`[DAILY-BACKUP] Completed for ${dateStr}`);
                return true;
            }
            console.error(`[DAILY-BACKUP] Failed for ${dateStr}`);
            return false;
        } catch (err) {
            console.error(`[DAILY-BACKUP] Error for ${dateStr}:`, err.message);
            return false;
        }
    }

    // Feature 6: Recover ALL missed daily backups on startup
    public async recoverMissedDailyBackup(): Promise<void> {
        const awsService = AwsService.getInstance();
        const state = awsService.getDailyBackupState();
        const now = new Date();
        const todayStr = this.getTokyoDateString(now);
        const todayMidnightJST = new Date(`${todayStr}T00:00:00+09:00`);
        const yesterdayMidnightJST = new Date(todayMidnightJST.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayStr = this.getTokyoDateString(yesterdayMidnightJST);

        if (state.lastCompletedDate && state.lastCompletedDate >= yesterdayStr) {
            console.log(`[DAILY-BACKUP-RECOVERY] No missing backup. Last completed: ${state.lastCompletedDate}`);
            return;
        }

        // Build list of all missing dates from (lastCompletedDate + 1 day) up to yesterday
        const missingDates: Date[] = [];
        let cursor: Date;
        if (!state.lastCompletedDate) {
            // No record at all — only recover yesterday to avoid unbounded history scan
            cursor = yesterdayMidnightJST;
        } else {
            const lastMidnightJST = new Date(`${state.lastCompletedDate}T00:00:00+09:00`);
            cursor = new Date(lastMidnightJST.getTime() + 24 * 60 * 60 * 1000);
        }

        while (cursor <= yesterdayMidnightJST) {
            missingDates.push(new Date(cursor));
            cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
        }

        console.log(`[DAILY-BACKUP-RECOVERY] Found ${missingDates.length} missing day(s): ${missingDates.map(d => this.getTokyoDateString(d)).join(", ")}`);

        for (const date of missingDates) {
            await this.runDailyBackup(date);
        }
    }

    // Feature 2 + Feature 6: Full startup recovery
    public async startupRecovery(): Promise<void> {
        console.log("[STARTUP] Running recovery checks...");
        await AwsService.getInstance().recoverPendingUploads();
        await this.recoverMissedDailyBackup();
        this.scheduleDailyBackup();
    }

    // Schedule daily backup at 00:00 Tokyo time
    private scheduleDailyBackup(): void {
        const scheduleNext = () => {
            const msUntilMidnight = this.getMsUntilTokyoMidnight();

            if (this.schedulerTimer) {
                clearTimeout(this.schedulerTimer);
            }

            this.schedulerTimer = setTimeout(async () => {
                // At Tokyo midnight, back up yesterday's data in Tokyo calendar
                const now = new Date();
                const todayStr = this.getTokyoDateString(now);
                const todayMidnightJST = new Date(`${todayStr}T00:00:00+09:00`);
                const yesterdayMidnightJST = new Date(todayMidnightJST.getTime() - 24 * 60 * 60 * 1000);
                await this.runDailyBackup(yesterdayMidnightJST);
                scheduleNext();
            }, msUntilMidnight);

            const hours = Math.floor(msUntilMidnight / 3600000);
            const minutes = Math.floor((msUntilMidnight % 3600000) / 60000);
            console.log(`[DAILY-BACKUP-SCHEDULER] Next backup scheduled in ${hours}h ${minutes}m (Tokyo midnight)`);
        };

        scheduleNext();
    }
}