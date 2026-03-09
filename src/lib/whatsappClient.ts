import { Client, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';

// Define the state for a single WhatsApp session
interface WhatsAppSessionState {
    instance: Client | null;
    qrCodeData: string | null;
    pairingCode: string | null;
    isReady: boolean;
    isInitializing: boolean;
    cooldownUntil: number;
    initError?: string | null;
}

declare global {
    var _whatsappClients: Map<string, WhatsAppSessionState>;
}

// Initialize globals
if (typeof globalThis._whatsappClients === 'undefined') {
    globalThis._whatsappClients = new Map<string, WhatsAppSessionState>();
}

class WhatsAppManager {
    private static getSessionState(userId: string): WhatsAppSessionState {
        if (!globalThis._whatsappClients.has(userId)) {
            globalThis._whatsappClients.set(userId, {
                instance: null,
                qrCodeData: null,
                pairingCode: null,
                isReady: false,
                isInitializing: false,
                cooldownUntil: 0,
                initError: null
            });
        }
        return globalThis._whatsappClients.get(userId)!;
    }

    public static async initialize(userId: string) {
        const state = this.getSessionState(userId);
        if (state.instance || state.isInitializing) return;

        state.isInitializing = true;
        console.log(`[WhatsApp - ${userId}] Starting background Puppeteer instance...`);

        // Use a consistent data path for persistent storage
        const authPath = process.env.WHATSAPP_SESSION_PATH || '.wwebjs_auth';

        const client = new Client({
            authStrategy: new LocalAuth({
                clientId: userId,
                dataPath: authPath
            }),
            puppeteer: {
                headless: true,
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-extensions',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-infobars',
                    '--window-position=0,0',
                    '--ignore-certificate-errors',
                    '--ignore-certificate-errors-spki-list',
                    '--single-process',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
                ]
            }
        });

        state.instance = client;

        client.on('qr', async (qr: string) => {
            console.log(`[WhatsApp - ${userId}] New QR Code generated.`);
            state.qrCodeData = await qrcode.toDataURL(qr);
            state.isReady = false;
            state.initError = null;
        });

        client.on('authenticated', () => {
            console.log(`[WhatsApp - ${userId}] Client AUTHENTICATED! Finalizing session...`);
            state.qrCodeData = null;
            state.pairingCode = null;
            state.initError = null;
        });

        client.on('auth_failure', (msg) => {
            console.error(`[WhatsApp - ${userId}] AUTHENTICATION FAILURE:`, msg);
            state.initError = `Auth Failure: ${msg}`;
            state.isReady = false;
        });

        client.on('ready', () => {
            console.log(`[WhatsApp - ${userId}] Client is READY! Connection established.`);
            state.isReady = true;
            state.qrCodeData = null;
            state.pairingCode = null;
            state.initError = null;
        });

        client.on('disconnected', (reason: string) => {
            console.log(`[WhatsApp - ${userId}] Client disconnected: ${reason}`);
            state.isReady = false;
            state.instance = null;
            state.pairingCode = null;
            state.initError = null;
        });

        client.on('loading_screen', (percent, message) => {
            console.log(`[WhatsApp - ${userId}] LOADING: ${percent}% - ${message}`);
        });

        client.on('change_state', (state_val) => {
            console.log(`[WhatsApp - ${userId}] STATE CHANGE: ${state_val}`);
        });

        try {
            console.log(`[WhatsApp - ${userId}] Initializing client (this may take 30-60s on Render)...`);
            await client.initialize();
        } catch (error: any) {
            console.error(`[WhatsApp - ${userId}] Initialization failed:`, error);
            state.initError = error?.message || String(error);
            if (state.instance) {
                try {
                    await state.instance.destroy();
                } catch (e) { }
            }
            state.instance = null;
        } finally {
            state.isInitializing = false;
        }
    }

    public static async requestPairingCode(userId: string, mobile: string): Promise<string | null> {
        let state = this.getSessionState(userId);

        if (!state.instance) {
            await this.initialize(userId);
            state = this.getSessionState(userId);
        }

        // Wait up to 10 seconds for initialization to complete if it's currently in progress
        let attempts = 0;
        while (state.isInitializing && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
            state = this.getSessionState(userId);
        }

        if (!state.instance) return null;

        // Ensure mobile is in international format without + or spaces
        let formatted = mobile.replace(/\D/g, '');
        if (formatted.length === 10) formatted = '91' + formatted;

        if (Date.now() < state.cooldownUntil) {
            const waitSec = Math.ceil((state.cooldownUntil - Date.now()) / 1000);
            throw new Error(`RATE_LIMIT: WhatsApp is rate-limiting requests. Please wait ${waitSec} seconds.`);
        }

        const instance = state.instance;
        if (!instance) {
            throw new Error('WhatsApp instance is not initialized. Please try again.');
        }

        try {
            console.log(`[WhatsApp - ${userId}] Requesting Pairing Code for: ${formatted}`);
            // Extended delay to ensure the browser has loaded the QR page and settled
            // On Render, 10-15 seconds is safer
            await new Promise(resolve => setTimeout(resolve, 10000));

            // CRITICAL FIX: The library expects onCodeReceivedEvent to be exposed in the browser
            // but it only exposes it if the client was initialized with pairWithPhoneNumber.
            // We expose it manually here if needed.
            if (instance.pupPage) {
                try {
                    await instance.pupPage.exposeFunction('onCodeReceivedEvent', (code: string) => {
                        instance.emit('code', code);
                        return code;
                    });
                } catch (e) {
                    // Ignore error if already exposed
                }
            }

            const code = await instance.requestPairingCode(formatted);
            console.log(`[WhatsApp - ${userId}] Pairing Code Generated: ${code}`);
            state.pairingCode = code;
            return code;
        } catch (error: any) {
            console.error(`[WhatsApp - ${userId}] Pairing Code Request Failed EXPLICITLY:`, error);

            // Robust error stringification
            let errorMsg = error?.message || '';
            let errorDetail = '';
            try {
                errorDetail = JSON.stringify(error);
            } catch (e) {
                errorDetail = String(error);
            }

            console.log(`[WhatsApp - ${userId}] Error Message: ${errorMsg}`);
            console.log(`[WhatsApp - ${userId}] Error Detail: ${errorDetail}`);

            const combined = (errorMsg + errorDetail).toLowerCase();

            if (
                combined.includes('rate-overlimit') ||
                combined.includes('429') ||
                combined.includes('rate_limit') ||
                errorMsg === 't'
            ) {
                console.log(`[WhatsApp - ${userId}] RATE LIMIT DETECTED. Setting cooldown.`);
                state.cooldownUntil = Date.now() + (15 * 60 * 1000); // 15 minute cooldown
                throw new Error('RATE_LIMIT: WhatsApp security has blocked linking for your device temporarily. Please wait AT LEAST 15 minutes before trying again.');
            }

            if (combined.includes('companionhelloerror')) {
                throw new Error('LINKING_ERROR: WhatsApp rejected the pairing request. Please wait 5 minutes, Hard Reset and try again.');
            }

            throw error; // Re-throw to be caught by the API
        }
    }

    public static getStatus(userId: string) {
        const state = this.getSessionState(userId);
        if (!state.instance && !state.isInitializing) {
            this.initialize(userId);
        }
        return {
            isReady: state.isReady,
            qrCode: state.qrCodeData,
            pairingCode: state.pairingCode,
            cooldownUntil: state.cooldownUntil,
            initError: state.initError || null
        };
    }

    public static async sendMessage(userId: string, phone: string, message: string): Promise<boolean> {
        const state = this.getSessionState(userId);
        if (!state.isReady || !state.instance) {
            console.error(`[WhatsApp - ${userId}] Cannot send message: Client is not ready.`);
            return false;
        }

        try {
            let formattedMobile = phone.replace(/\D/g, '');
            if (formattedMobile.length === 10) {
                formattedMobile = '91' + formattedMobile;
            }
            const jid = `${formattedMobile}@c.us`;

            await state.instance.sendMessage(jid, message);
            return true;
        } catch (error) {
            console.error(`[WhatsApp - ${userId}] Failed to send message:`, error);
            return false;
        }
    }

    public static async reset(userId: string) {
        const state = this.getSessionState(userId);
        if (state.instance) {
            try {
                await state.instance.destroy();
            } catch (e) { }
        }
        state.instance = null;
        state.isReady = false;
        state.qrCodeData = null;
        state.pairingCode = null;
        this.initialize(userId);
    }
}

// Ensure at least one admin initializes on load if needed, otherwise lazy initialize
// Removed the global initialization block to allow lazy initialization per user

export default WhatsAppManager;
