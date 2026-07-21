const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");

const {
    S3Client,
    PutObjectCommand,
} = require("@aws-sdk/client-s3");

const app = express();

//
// CONFIG
//
const PORT = 7001;

const INSTANCE_ID =
    process.env.TESTNOMY_INSTANCE_ID || "unknown";

const S3_BUCKET =
    process.env.TESTNOMY_S3_BUCKET || "";

const AWS_REGION =
    process.env.AWS_REGION || "ap-southeast-1";

const SNAPSHOT_DIR =
    path.join(os.tmpdir(), "live-shadow");

const s3Client = new S3Client({
    region: AWS_REGION,
});

//
// HELPERS
//
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
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

//
// ======================================================
// DATA PROVIDER
//
// THAY HÀM NÀY KHI APPLY APP THẬT
// ======================================================
//
async function buildMockSnapshots() {
    const currentDate = getCurrentDate();

    return [
        {
            fileName: `influxdb_${currentDate}.json`,
            content: {
                source: "influxdb",
                status: "hello world",
                message:
                    "Daily snapshot - InfluxDB metrics",
                date: currentDate,
            },
        },
        {
            fileName: `mariadb_${currentDate}.json`,
            content: {
                source: "mariadb",
                status: "hello world",
                message:
                    "Daily snapshot - MariaDB metrics",
                date: currentDate,
            },
        },
    ];
}

//
// ======================================================
// SAVE FILES TO LOCAL QUEUE
// ======================================================
//
function saveFilesToLocal(files) {
    ensureDirectory(SNAPSHOT_DIR);

    const filePaths = [];

    for (const file of files) {
        const filePath = path.join(
            SNAPSHOT_DIR,
            file.fileName
        );

        fs.writeFileSync(
            filePath,
            JSON.stringify(
                file.content,
                null,
                2
            ),
            "utf8"
        );

        filePaths.push(filePath);

        console.log(
            `[QUEUE] ${file.fileName}`
        );
    }

    return filePaths;
}

//
// ======================================================
// GENERIC RETRY
// ======================================================
//
async function retry(
    action,
    retries = 3,
    delayMs = 3000
) {
    let lastError;

    for (
        let attempt = 1;
        attempt <= retries;
        attempt++
    ) {
        try {
            return await action();
        } catch (err) {
            lastError = err;

            console.error(
                `[RETRY ${attempt}/${retries}] ${err.message}`
            );

            if (attempt < retries) {
                await sleep(delayMs);
            }
        }
    }

    throw lastError;
}

//
// ======================================================
// S3 UPLOAD
// ======================================================
//
async function uploadFile(
    filePath,
    s3Key
) {
    await retry(async () => {
        await s3Client.send(
            new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: s3Key,
                Body: fs.createReadStream(
                    filePath
                ),
                ContentType:
                    "application/json",
            })
        );
    });
}

//
// ======================================================
// PROCESS 1 FILE
//
// SUCCESS => DELETE
// FAIL => KEEP
// ======================================================
//
async function processFile(
    filePath
) {
    const fileName =
        path.basename(filePath);

    const s3Key =
        `${INSTANCE_ID}/${getCurrentDate()}/live-shadow/${fileName}`;

    try {
        await uploadFile(
            filePath,
            s3Key
        );

        fs.unlinkSync(filePath);

        console.log(
            `[SUCCESS] ${fileName}`
        );

        return true;
    } catch (err) {
        console.error(
            `[FAILED] ${fileName}`
        );

        console.error(err.message);

        //
        // KHÔNG XOÁ FILE
        //
        return false;
    }
}

//
// ======================================================
// UPLOAD ALL PENDING FILES
// ======================================================
//
async function processPendingFiles() {
    if (!S3_BUCKET) {
        console.log(
            "Missing TESTNOMY_S3_BUCKET"
        );
        return;
    }

    ensureDirectory(SNAPSHOT_DIR);

    const files =
        fs.readdirSync(
            SNAPSHOT_DIR
        );

    if (files.length === 0) {
        return;
    }

    console.log(
        `Pending files: ${files.length}`
    );

    for (const fileName of files) {
        const filePath = path.join(
            SNAPSHOT_DIR,
            fileName
        );

        await processFile(
            filePath
        );
    }
}

//
// ======================================================
// PUBLIC SERVICE
//
// APP THẬT CHỈ CẦN DÙNG HÀM NÀY
// ======================================================
//
async function uploadDataToS3(
    dataProvider
) {
    const files =
        await dataProvider();

    saveFilesToLocal(files);

    await processPendingFiles();
}

//
// ======================================================
// STARTUP RECOVERY
// ======================================================
//
async function startupRecovery() {
    console.log(
        "Checking pending queue..."
    );

    await processPendingFiles();
}

//
// ======================================================
// HEALTHCHECK
// ======================================================
//
app.get(
    "/healthcheck",
    (req, res) => {
        res.status(200).json({
            status: "UP",
            instanceId:
                INSTANCE_ID,
            bucket:
                S3_BUCKET,
        });
    }
);

//
// ======================================================
// TEST API
//
// SAU NÀY CÓ THỂ XOÁ
// ======================================================
//
app.post(
    "/test-upload",
    async (req, res) => {
        try {
            await uploadDataToS3(
                buildMockSnapshots
            );

            res.json({
                success: true,
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                error:
                    err.message,
            });
        }
    }
);

//
// ======================================================
// START APP
// ======================================================
//
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

        await startupRecovery();

        //
        // Retry pending queue mỗi 5 phút
        //
        setInterval(
            async () => {
                try {
                    await processPendingFiles();
                } catch (err) {
                    console.error(err);
                }
            },
            5 * 60 * 1000
        );
    }
);

//
// EXPORT ĐỂ APP THẬT REUSE
//
module.exports = {
    uploadDataToS3,
};