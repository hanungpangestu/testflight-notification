const fs = require("fs");
const axios = require("axios");
const dotenv = require("dotenv");
const winston = require("winston");
require("winston-daily-rotate-file");

dotenv.config();

const transport = new winston.transports.DailyRotateFile({
    filename: "testflight_checker-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    maxSize: "1m",
    maxFiles: "5"
});

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(
            (info) => `${info.timestamp} - ${info.level.toUpperCase()}: ${info.message}`
        )
    ),
    transports: [new winston.transports.Console(), transport]
});

const CONFIG_FILE_PATH = "apps_config.json";
const CHECK_INTERVAL = process.env.CHECK_INTERVAL
    ? parseInt(process.env.CHECK_INTERVAL, 10)
    : 60 * 1000;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function safeRequest(url, method = "get", timeout = 10000, options = {}) {
    try {
        const res = await axios({
            url,
            method,
            timeout,
            headers: { "User-Agent": "Mozilla/5.0", ...(options.headers || {}) },
            ...options
        });
        return res;
    } catch (e) {
        logger.error(`Request error for ${url}: ${e.message}`);
        return null;
    }
}

function loadConfig(path, defaultContent = {}) {
    try {
        if (!fs.existsSync(path)) {
            fs.writeFileSync(path, JSON.stringify(defaultContent, null, 4));
            return defaultContent;
        }
        return JSON.parse(fs.readFileSync(path, "utf-8"));
    } catch (e) {
        logger.error("Error loading config: " + e.message);
        return defaultContent;
    }
}

function saveConfig(apps) {
    try {
        fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(apps, null, 4));
        logger.info("Configuration saved.");
    } catch (e) {
        logger.error("Error saving config: " + e.message);
    }
}

async function sendTelegramNotification(msg) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        logger.warn("Telegram env variable not set.");
        return;
    }

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const maxRetry = 3;

    for (let attempt = 1; attempt <= maxRetry; attempt++) {
        logger.info(`Sending Telegram notification (attempt ${attempt})...`);

        const payload = new URLSearchParams({
            chat_id: TELEGRAM_CHAT_ID,
            text: msg,
            parse_mode: "Markdown"
        });

        const res = await safeRequest(url, "post", 10000, {
            data: payload.toString(),
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        if (res) {
            logger.info("Telegram notification sent successfully.");
            return;
        }

        const delay = attempt * 2000;
        logger.warn(`Failed attempt ${attempt}. Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    logger.error("All attempts failed. Could not send Telegram notification.");
}

async function checkTestFlightSlot(appName, appData) {
    try {
        const testflightUrl = appData.url;
        const lastState = appData.last_state ?? null;

        const response = await safeRequest(testflightUrl);
        if (!response) return;

        const html = response.data;
        let currentState = "unknown";

        if (
            html.includes("This beta is full") ||
            html.includes("This beta isn't accepting any new testers")
            
        ) {
            currentState = "full";
        } else if (
            html.includes("View in TestFlight") &&
            html.includes("Testing Apps with TestFlight")
        ) {
            currentState = "available";
        }

        if (currentState !== lastState) {
            if (currentState === "available") {
                logger.info(`Slots available for ${appName}!`);
                await sendTelegramNotification(
                    `🚀 TestFlight for *${appName}* AVAILABLE!\n${testflightUrl}`
                );
            } else if (currentState === "full" && lastState === "available") {
                logger.info(`Slots filled for ${appName}.`);
                await sendTelegramNotification(
                    `❌ TestFlight for *${appName}* FULL.\n${testflightUrl}`
                );
            }

            appData.last_state = currentState;
        } else {
            logger.info(`No change for ${appName}. (${currentState})`);
        }
    } catch (e) {
        logger.error(`Error checking ${appName}: ${e.message}`);
    }
}

(async () => {
    let apps = loadConfig(CONFIG_FILE_PATH, {});

    if (!Object.keys(apps).length) {
        logger.warn("No apps to monitor.");
        return;
    }

    logger.info("Starting TestFlight Checker...");

    while (true) {
        for (const [name, data] of Object.entries(apps)) {
            if (typeof data === "string") {
                apps[name] = { url: data, last_state: null };
            }

            logger.info(`Checking: ${name}`);
            await checkTestFlightSlot(name, apps[name]);
        }

        saveConfig(apps);
        await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL));
    }
})();