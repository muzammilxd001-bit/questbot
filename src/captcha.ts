import { Constants } from './constants';
import { CaptchaDataFromRequest } from './interface';
import { YesCaptchaSolver } from './providers/yescaptcha';
import { CapSolverClient } from './providers/capsolver';

let capSolverClient: CapSolverClient | null = null;
let yesCaptchaClient: YesCaptchaSolver | null = null;

if (process.env.CAPSOLVER_API_KEY) {
        console.log('CapSolver API key found. Auto captcha solving enabled (CapSolver).');
        capSolverClient = new CapSolverClient(process.env.CAPSOLVER_API_KEY);
} else if (process.env.YES_CAPTCHA_API_KEY) {
        console.log('YesCaptcha API key found. Auto captcha solving enabled (YesCaptcha).');
        yesCaptchaClient = new YesCaptchaSolver(process.env.YES_CAPTCHA_API_KEY);
} else {
        console.warn('No captcha API key set. Reward redemption will fail if Discord requires a captcha.');
        console.warn('Set CAPSOLVER_API_KEY (recommended) or YES_CAPTCHA_API_KEY to enable auto-solving.');
}

export function isCaptchaSolvingEnabled(): boolean {
        return capSolverClient !== null || yesCaptchaClient !== null;
}

export function solveCaptcha(data: CaptchaDataFromRequest): Promise<string> {
        if (capSolverClient) {
                return capSolverClient
                        .hcaptcha(data.captcha_sitekey, 'https://discord.com', {
                                rqdata: data.captcha_rqdata,
                                isInvisible: false,
                                userAgent: Constants.USER_AGENT,
                        })
                        .then((result) => result.gRecaptchaResponse);
        }

        if (yesCaptchaClient) {
                return yesCaptchaClient
                        .hcaptcha(data.captcha_sitekey, 'https://discord.com', {
                                rqdata: data.captcha_rqdata,
                                isInvisible: false,
                                userAgent: Constants.USER_AGENT,
                        })
                        .then((result) => result.gRecaptchaResponse);
        }

        return Promise.reject(
                new Error('No captcha solver configured. Set CAPSOLVER_API_KEY or YES_CAPTCHA_API_KEY.'),
        );
}
