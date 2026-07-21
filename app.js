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

const app = express();

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

function saveFilesToLocal(files) {
    ensureDirectory(SNAPSHOT_DIR);

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
            )
        );

        console.log(
            `[QUEUE] ${file.fileName}`
        );
    }
}

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
                `[RETRY ${attempt}/${retries}]`,
                err.message
            );

            if (attempt < retries) {
                await sleep(delayMs);
            }
        }
    }

    throw lastError;
}

async function uploadFile(
    filePath,
    s3Key
) {

    const fileContent =
        fs.readFileSync(filePath);

    await retry(async () => {

        console.log({
            bucket: S3_BUCKET,
            region: AWS_REGION,
            key: s3Key,
        });

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

        console.dir(err, {
            depth: null,
        });

        return false;
    }
}

async function processPendingFiles() {

    if (!S3_BUCKET) {

        console.log(
            "Missing TESTNOMY_S3_BUCKET"
        );

        return;
    }

    ensureDirectory(
        SNAPSHOT_DIR
    );

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

        await processFile(
            path.join(
                SNAPSHOT_DIR,
                fileName
            )
        );
    }
}

async function uploadDataToS3(
    provider
) {
    const files =
        await provider();

    saveFilesToLocal(files);

    await processPendingFiles();
}

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

app.get(
    "/whoami",
    async (req, res) => {

        try {

            const result =
                await stsClient.send(
                    new GetCallerIdentityCommand({})
                );

            res.json(result);

        } catch (err) {

            console.dir(err, {
                depth: null,
            });

            res.status(500).json({
                error:
                    err.message,
            });
        }
    }
);

app.get(
    "/debug-s3",
    async (req, res) => {

        try {

            console.log(
                "======== DEBUG S3 ========"
            );

            console.log({
                bucket:
                    S3_BUCKET,
                region:
                    AWS_REGION,
            });

            await s3Client.send(
                new PutObjectCommand({
                    Bucket:
                        S3_BUCKET,
                    Key:
                        "debug-test.txt",
                    Body:
                        "hello world",
                    ContentType:
                        "text/plain",
                })
            );

            res.json({
                         success: true,
            });

        } catch (err) {

            console.error(
                "DEBUG S3 ERROR"
            );

            console.dir(err, {
                depth: null,
            });

            res.status(500).json({
                success: false,
                error:
                    err.message,
            });
        }
    }
);

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

            console.dir(err, {
                depth: null,
            });

            res.status(500).json({
                success: false,
                error:
                    err.message,
            });
        }
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