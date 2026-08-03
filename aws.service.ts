import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const INSTANCE_ID = process.env.TESTNOMY_INSTANCE_ID || "unknown";
const S3_BUCKET = process.env.TESTNOMY_S3_BUCKET || "test_no_my";
const AWS_REGION = process.env.TESTNOMY_REGION || "ap-northeast-1";
const s3Client = new S3Client({
    region: AWS_REGION,
});
const EXECUTION_SNAPSHOT_DIR = path.join(os.tmpdir(), "live-shadow");
const DAILY_SNAPSHOT_DIR = path.join(os.tmpdir(), "daily-snapshots");
const FAIL_SNAPSHOT_DIR = path.join(os.tmpdir(), "fail-file");
const SYSTEM_DIR = path.join(os.tmpdir(), "backup-system");
const DAILY_BACKUP_STATE_FILE = path.join(SYSTEM_DIR, "daily-backup-state.json");

// Exponential backoff delays in ms (1s, 5s, 15s, 30s, 60s)
const RETRY_DELAYS = [1000, 5000, 15000, 30000, 60000];

export default class AwsService {
    private static instance: AwsService;

    private constructor() {
    }

    public static getInstance(): AwsService {
        if (!AwsService.instance) {
            AwsService.instance = new AwsService();
        }
        return AwsService.instance;
    }

    private ensureDirectory(directory) {
        fs.mkdirSync(directory, {
            recursive: true,
        });
    }

    private getCurrentDate() {
        return new Date()
            .toISOString()
            .split("T")[0];
    }

    private sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private async retry(action) {
        let lastError;
        const maxRetries = RETRY_DELAYS.length;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await action();
            } catch (err) {
                lastError = err;
                console.error(`[RETRY] attempt=${attempt} ${err.message}`);
                if (attempt < maxRetries) {
                    await this.sleep(RETRY_DELAYS[attempt - 1]);
                }
            }
        }
        throw lastError;
    }

    private async uploadFile(filePath, s3Key) {
        const fileContent = fs.readFileSync(filePath);
        console.log(`[UPLOAD] ${path.basename(filePath)} to S3 with key: ${s3Key}`);
        await this.retry(async () => {
            console.log({ bucket: S3_BUCKET, region: AWS_REGION, key: s3Key });
            await s3Client.send(
                new PutObjectCommand({
                    Bucket: S3_BUCKET,
                    Key: s3Key,
                    Body: fileContent,
                    ContentType: "application/json",
                })
            );
        });
    }

    private extractDateFromFileName(fileName: string): string {
        const match = fileName.match(/\d{4}-\d{2}-\d{2}/);
        if (match) {
            return match[0];
        }
        return this.getCurrentDate();
    }

    private async processFile(filePath, snapshotsType) {
        const fileName = path.basename(filePath);
        const snapshotDate = this.extractDateFromFileName(fileName);
        const s3Key = `${INSTANCE_ID}/${snapshotDate}/${snapshotsType}/${fileName}`;
        try {
            await this.uploadFile(filePath, s3Key);
            fs.unlinkSync(filePath);
            console.log(`[SUCCESS] ${fileName}`);
            return true;
        } catch (err) {
            console.error(`[FAILED] ${fileName} ${err.message}`);
            console.dir(err, { depth: null });
            try {
                const failDir = FAIL_SNAPSHOT_DIR;
                if (!fs.existsSync(failDir)) {
                    fs.mkdirSync(failDir, { recursive: true });
                }
                const failPath = path.join(failDir, fileName);
                fs.renameSync(filePath, failPath);
                console.log(`[MOVED TO FAILFILE] ${failPath}`);
            } catch (moveErr) {
                console.error(`[MOVE FAILED] ${fileName}`, moveErr);
            }
            return false;
        }
    }

    private async processPendingFiles(snapshotsType): Promise<any> {
        const snapshotDir = snapshotsType === "daily-snapshots" ? DAILY_SNAPSHOT_DIR : EXECUTION_SNAPSHOT_DIR;
        const result = { success: [], failed: [], };
        if (!S3_BUCKET) {
            console.log("Missing TESTNOMY_S3_BUCKET");
            result.failed.push("Missing TESTNOMY_S3_BUCKET");
            return result;
        }
        this.ensureDirectory(snapshotDir);

        const files = fs.readdirSync(snapshotDir);
        if (files.length === 0) {
            return result;
        }
        console.log(`Pending files: ${files.length}`);
        for (const fileName of files) {
            const filePath = path.join(snapshotDir, fileName);
            const uploaded = await this.processFile(filePath, snapshotsType);
            if (uploaded) {
                result.success.push(fileName);
            } else {
                result.failed.push(fileName);
            }
        }
        return result;
    }

    private saveFilesToLocal(files, snapshotsType) {
        const snapshotDir = snapshotsType === "daily-snapshots" ? DAILY_SNAPSHOT_DIR : EXECUTION_SNAPSHOT_DIR;
        console.log(`Saving files to local directory: ${snapshotDir}`);
        this.ensureDirectory(snapshotDir);
        for (const file of files) {
            const filePath = path.join(snapshotDir, file.fileName);
            fs.writeFileSync(
                filePath,
                JSON.stringify(
                    file.content,
                    null,
                    2
                )
            );
            console.log(`[QUEUE] ${file.fileName}`);
        }
    }

    private async uploadDataToS3(files, snapshotsType) {
        this.saveFilesToLocal(files, snapshotsType);
        const result = await this.processPendingFiles(snapshotsType);
        return result;
    }

    public async uploadToS3(files, snapshotsType): Promise<any> {
        try {
            const result = await this.uploadDataToS3(files, snapshotsType);
            if (result.failed.length > 0) {
                // If there are failed uploads 
                return {
                    success: false,
                    uploaded:
                        result.success,
                    failed:
                        result.failed,
                };
            }
            return {
                success: true,
                uploaded:
                    result.success,
                failed: [],
            };
        } catch (err) {
            console.dir(err, { depth: null, });
            return {
                success: false,
                error:
                    err.message,
            };
        }
    }

    // Feature 2: Startup recovery - scan pending dirs and re-upload
    public async recoverPendingUploads(): Promise<void> {
        console.log("[RECOVERY] Scanning pending upload files...");
        const types: Array<{ type: string; dir: string }> = [
            { type: "live-shadow", dir: EXECUTION_SNAPSHOT_DIR },
            { type: "daily-snapshots", dir: DAILY_SNAPSHOT_DIR },
        ];
        for (const { type, dir } of types) {
            if (!fs.existsSync(dir)) continue;
            const files = fs.readdirSync(dir);
            if (files.length > 0) {
                console.log(`[RECOVERY] Found ${files.length} pending file(s) in ${type}, uploading...`);
                await this.processPendingFiles(type);
            }
        }
    }

    // Feature 3: Health status
    public getHealth(): { status: string; pendingExecutionFiles: number; pendingDailyFiles: number; failedFiles: number } {
        const countFiles = (dir: string) => {
            if (!fs.existsSync(dir)) return 0;
            return fs.readdirSync(dir).length;
        };
        const pendingExecutionFiles = countFiles(EXECUTION_SNAPSHOT_DIR);
        const pendingDailyFiles = countFiles(DAILY_SNAPSHOT_DIR);
        const failedFiles = countFiles(FAIL_SNAPSHOT_DIR);
        const healthStatus = failedFiles > 0 ? "WARNING" : "OK";
        return { status: healthStatus, pendingExecutionFiles, pendingDailyFiles, failedFiles };
    }

    private isExecutionSnapshot(fileName: string): boolean {
        return /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/.test(fileName);
    }

    // Feature 4: Retry failed uploads
    public async retryFailedUploads(fileName?: string): Promise<{ success: boolean; retried: number }> {
        if (!fs.existsSync(FAIL_SNAPSHOT_DIR)) {
            return { success: true, retried: 0 };
        }
        let files: string[];
        if (fileName) {
            const filePath = path.join(FAIL_SNAPSHOT_DIR, fileName);
            if (!fs.existsSync(filePath)) {
                return { success: false, retried: 0 };
            }
            files = [fileName];
        } else {
            files = fs.readdirSync(FAIL_SNAPSHOT_DIR);
        }
        if (files.length === 0) {
            return { success: true, retried: 0 };
        }
        let hasExecutionSnapshots = false;
        let hasDailySnapshots = false;
        for (const file of files) {
            const srcPath = path.join(FAIL_SNAPSHOT_DIR, file);
            if (this.isExecutionSnapshot(file)) {
                hasExecutionSnapshots = true;
                this.ensureDirectory(EXECUTION_SNAPSHOT_DIR);
                const destPath = path.join(
                    EXECUTION_SNAPSHOT_DIR,
                    file
                );
                fs.renameSync(srcPath, destPath);
            } else {
                hasDailySnapshots = true;
                this.ensureDirectory(DAILY_SNAPSHOT_DIR);
                const destPath = path.join(
                    DAILY_SNAPSHOT_DIR,
                    file
                );
                fs.renameSync(srcPath, destPath);
            }
        }
        if (hasExecutionSnapshots) {
            await this.processPendingFiles("live-shadow");
        }
        if (hasDailySnapshots) {
            await this.processPendingFiles("daily-snapshots");
        }
        return {
            success: true,
            retried: files.length,
        };
    }

    // Feature 6: Daily backup state management
    public getDailyBackupState(): { lastCompletedDate: string | null } {
        this.ensureDirectory(SYSTEM_DIR);
        if (!fs.existsSync(DAILY_BACKUP_STATE_FILE)) {
            return { lastCompletedDate: null };
        }
        try {
            const content = fs.readFileSync(DAILY_BACKUP_STATE_FILE, "utf-8");
            return JSON.parse(content);
        } catch {
            return { lastCompletedDate: null };
        }
    }

    public updateDailyBackupState(date: string): void {
        this.ensureDirectory(SYSTEM_DIR);
        fs.writeFileSync(DAILY_BACKUP_STATE_FILE, JSON.stringify({ lastCompletedDate: date }, null, 2));
    }
}
