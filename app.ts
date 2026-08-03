import * as express from "express";
import { status } from "http-status";
import AwsService from "./aws.service";
import BackupService from "./backup.service";

const app = express();

app.use(express.json());

// Add to test for upload data to S3 when the execution snapshot is created
async function buildInfluxSnapshot() {
    console.log("Uploading data to AWS S3...");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const mariaDbData = {
        fileName: `mariadb_${timestamp}.json`,
        content: {}
    }
    const influxLogByScenarioId = {};
    const influxDbData = {
        fileName: `influxdb_${timestamp}.json`,
        content: influxLogByScenarioId
    };
    const arrayData = [mariaDbData, influxDbData];
    console.log(JSON.stringify(arrayData, null, 2));
    const uploadDataResult = await AwsService.getInstance().uploadToS3(arrayData, "live-shadow");
    console.log("Upload result:", uploadDataResult);
}
app.post("/backup/execution", async (req, res) => {
    try {
        await buildInfluxSnapshot();
        return res.status(status.OK).json({ success: true });
    } catch (error: any) {
        return res.status(status.INTERNAL_SERVER_ERROR).json({
            success: false,
            retried: 0,
            error: error.message,
        });
    }
});

///////////////////////////////////////////////////////////////////////

app.get("/backup/health", async (req, res) => {
    try {
        const health = AwsService.getInstance().getHealth();
        return res.status(status.OK).json(health);
    } catch (error: any) {
        return res.status(status.INTERNAL_SERVER_ERROR).json({
            status: "CRITICAL",
            message: error.message,
        });
    }
});

app.post("/backup/retry-failed", async (req, res) => {
    try {
        const result = await AwsService.getInstance().retryFailedUploads();
        return res.status(status.OK).json(result);
    } catch (error: any) {
        return res.status(status.INTERNAL_SERVER_ERROR).json({
            success: false,
            retried: 0,
            error: error.message,
        });
    }
});

app.post("/backup/retry-failed/:fileName", async (req, res) => {
    try {
        const { fileName } = req.params;
        const result = await AwsService.getInstance().retryFailedUploads(fileName);

        return res.status(status.OK).json(result);
    } catch (error: any) {
        return res.status(status.INTERNAL_SERVER_ERROR).json({
            success: false,
            retried: 0,
            error: error.message,
        });
    }
});

app.post("/backup/backup-before-stop", async (req, res) => {
    try {
        const result = await BackupService.getInstance().backupBeforeStop();

        if (!result.success) {
            return res.status(status.INTERNAL_SERVER_ERROR).json(result);
        }

        return res.status(status.OK).json(result);
    } catch (error: any) {
        return res.status(status.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: error.message,
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    // Feature 2 + Feature 6: Run startup recovery (pending uploads + missed daily backup)
    BackupService.getInstance().startupRecovery().catch((err) => {
        console.error("[STARTUP] Recovery error:", err.message);
    });
});