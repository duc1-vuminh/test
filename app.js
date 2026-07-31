const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");

const {
    S3Client,
    PutObjectCommand,
} = require("@aws-sdk/client-s3");

const {
    STSClient,
    GetCallerIdentityCommand,
} = require("@aws-sdk/client-sts");

const cron = require("node-cron");

const app = express();

const PORT = 7001;

const INSTANCE_ID =
    process.env.TESTNOMY_INSTANCE_ID || "unknown";

const S3_BUCKET =
    process.env.TESTNOMY_S3_BUCKET || "";

const AWS_REGION =
    process.env.TESTNOMY_REGION || "ap-northeast-1";

const EXECUTION_SNAPSHOT_DIR = path.join(os.tmpdir(), "live-shadow");
const DAILY_SNAPSHOT_DIR = path.join(os.tmpdir(), "daily-snapshots");
const FAIL_SNAPSHOT_DIR = path.join(os.tmpdir(), "fail-file");

const s3Client = new S3Client({
    region: AWS_REGION,
});

const stsClient = new STSClient({
    region: AWS_REGION,
});

function getCurrentDate() {
    return new Date()
        .toISOString()
        .split("T")[0];
}

function ensureDirectory(directory) {
    fs.mkdirSync(directory, {
        recursive: true,
    });
}

function sleep(ms) {
    return new Promise((resolve) =>
        setTimeout(resolve, ms)
    );
}


function getYesterdayRange() {
    const today = new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    const yesterday = new Date(today);

    yesterday.setDate(
        yesterday.getDate() - 1
    );

    return {
        start: yesterday,
        end: today
    };
}

function getTodayRange() {
    const start = new Date();

    start.setHours(
        0,
        0,
        0,
        0
    );

    const end = new Date();

    return {
        start,
        end
    };
}

async function buildInfluxDBSnapshot(
    influxDb,
    start,
    end
) {
    // const { start, end } =
    //     getYesterdayRange();

    const signalLogs =
        await influxDb.query(
            start,
            end
        );

    if (
        !signalLogs ||
        signalLogs.length === 0
    ) {
        console.log(
            "No InfluxDB data found. Skip snapshot."
        );

        return null;
    }

    const date =
        start
            .toISOString()
            .split("T")[0];

    return {
        fileName:
            `influxdb_${date}.json`,

        content: {
            signalLogs
        }
    };
}

async function buildMariaDBSnapshot(mariaDb, start, end) {
    // const { start, end } =
    //     getYesterdayRange();
    const countResult =
        await mariaDb.query(
            `
            SELECT COUNT(*) AS total
            FROM scenarioRunGroup
            WHERE finishTime >= ?
            AND finishTime < ?
            `,
            [start, end]
        );

    const total =
        countResult[0]?.total || 0;

    if (total === 0) {
        console.log(
            "No data found. Skip snapshot."
        );

        return null;
    }

    const [
        repositories,
        tags,
        suites,
        scenarios,
        scenarioRuns,
        scenarioRunGroups
    ] = await Promise.all([
        mariaDb.query(
            `SELECT * FROM repositories`
        ),

        mariaDb.query(
            `SELECT * FROM tags`
        ),

        mariaDb.query(
            `SELECT * FROM suites`
        ),

        mariaDb.query(
            `SELECT * FROM scenarios`
        ),

        mariaDb.query(
            `
            SELECT *
            FROM scenarioRuns
            WHERE finishTime >= ?
            AND finishTime < ?
            ORDER BY finishTime
            `,
            [start, end]
        ),

        mariaDb.query(
            `
            SELECT *
            FROM scenarioRunGroup
            WHERE finishTime >= ?
            AND finishTime < ?
            ORDER BY finishTime
            `,
            [start, end]
        )
    ]);

    const date =
        start
            .toISOString()
            .split("T")[0];

    return {
        fileName:
            `mariadb_${date}.json`,

        content: {
            repositories,
            tags,
            suites,
            scenarios,
            scenarioRuns,
            scenarioRunGroups
        }
    };
}


async function buildMockSnapshots() {
    const currentDate = getCurrentDate();

    return [
        {
            fileName: `influxdb_${currentDate}.json`,
            content: {
                source: "influxdb",
                status: "hello world",
                date: currentDate,
            },
        },
        {
            fileName: `mariadb_${currentDate}.json`,
            content: {
                source: "mariadb",
                status: "hello world",
                date: currentDate,
            },
        },
    ];
}

// const cron = require("node-cron");

// cron.schedule(
//     "0 0 * * *",
//     async () => {

//         console.log(
//             "[CRON] Daily upload started"
//         );

//         try {

//             const result =
//                 await uploadDataToS3(
//                     buildMockSnapshots
//                 );

//             console.log(result);

//         } catch (err) {

//             console.error(
//                 "[CRON] Failed"
//             );

//             console.error(err);
//         }
//     },
//     {
//         timezone: "Asia/Ho_Chi_Minh",
//     }
// );

async function saveFilesToLocal(files, snapshotsType) {
    const snapshotDir = snapshotsType === "daily-snapshots" ? DAILY_SNAPSHOT_DIR : EXECUTION_SNAPSHOT_DIR;
    console.log(`Saving files to local directory: ${snapshotDir}`);
    ensureDirectory(snapshotDir);
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

async function retry(action, retries = 3, delayMs = 3000) {
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await action();
        } catch (err) {
            lastError = err;
            console.error(`[RETRY ${attempt}/${retries}]`, err.message);
            if (attempt < retries) {
                await sleep(delayMs);
            }
        }
    }
    throw lastError;
}

async function uploadFile(filePath, s3Key) {
    const fileContent = fs.readFileSync(filePath);
    await retry(async () => {
        console.log({ bucket: S3_BUCKET, region: AWS_REGION, key: s3Key, });
        await s3Client.send(
            new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: s3Key,
                Body: fileContent,
                ContentType:
                    "application/json",
            })
        );
    });
}

async function processFile(filePath, snapshotsType) {
    const fileName = path.basename(filePath);
    const s3Key = `${INSTANCE_ID}/${getCurrentDate()}/${snapshotsType}/${fileName}`;

    try {
        await uploadFile(filePath, s3Key);
        fs.unlinkSync(filePath);
        console.log(`[SUCCESS] ${fileName}`);
        return true;
    } catch (err) {
        console.error(`[FAILED] ${fileName}`);
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

async function processPendingFiles(snapshotsType) {
    const snapshotDir = snapshotsType === "daily-snapshots" ? DAILY_SNAPSHOT_DIR : EXECUTION_SNAPSHOT_DIR;
    const result = { success: [], failed: [], };
    if (!S3_BUCKET) {
        console.log("Missing TESTNOMY_S3_BUCKET");
        result.failed.push("Missing TESTNOMY_S3_BUCKET");
        return result;
    }
    ensureDirectory(snapshotDir);

    const files = fs.readdirSync(snapshotDir);
    if (files.length === 0) {
        return result;
    }
    console.log(`Pending files: ${files.length}`);
    for (const fileName of files) {
        const filePath = path.join(snapshotDir, fileName);
        const uploaded = await processFile(filePath, snapshotsType);
        if (uploaded) {
            result.success.push(fileName);
        } else {
            result.failed.push(fileName);
        }
    }
    return result;
}

async function uploadDataToS3(files, snapshotsType) {
    saveFilesToLocal(files, snapshotsType);
    const result = await processPendingFiles(snapshotsType);
    return result;
}

app.post(
    "/test-upload",
    async (req, res) => {
        try {
            const files = await buildMockSnapshots();
            const snapshotsType = req.query.snapshotsType || "daily-snapshots";
            const result = await uploadDataToS3(files, snapshotsType);
            console.log("Upload result:", result);
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
);

app.get(
    "/healthcheck",
    (req, res) => {

        res.json({
            status: "UP",
            instanceId:
                INSTANCE_ID,
            bucket:
                S3_BUCKET,
            region:
                AWS_REGION,
        });
    }
);

app.listen(
    PORT,
    "0.0.0.0",
    async () => {

        console.log(
            `Listening on port ${PORT}`
        );

        console.log(
            `InstanceId=${INSTANCE_ID}`
        );

        console.log(
            `Bucket=${S3_BUCKET}`
        );

        console.log(
            `Region=${AWS_REGION}`
        );

        await processPendingFiles();

        setInterval(
            processPendingFiles,
            5 * 60 * 1000
        );
    }
);

module.exports = {
    uploadDataToS3,
};