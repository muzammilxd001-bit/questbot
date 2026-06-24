import { fetch } from 'undici';

type BaseResponse = {
    errorId: 0 | 1;
    errorCode?: string;
    errorDescription?: string;
    taskId?: string;
};

type TaskResult<T extends object = object> = BaseResponse & {
    status: 'idle' | 'processing' | 'ready' | 'failed';
    solution?: T;
};

type HCaptchaTask = {
    type: 'HCaptchaTaskProxyless' | 'HCaptchaTurboTask';
    websiteURL: string;
    websiteKey: string;
    userAgent?: string;
    isInvisible?: boolean;
    enterprisePayload?: {
        rqdata?: string;
    };
};

type HCaptchaSolution = {
    gRecaptchaResponse: string;
    userAgent?: string;
    respKey?: string;
};

export class CapSolverClient {
    public static readonly BASE_URL = 'https://api.capsolver.com';
    private readonly apiKey: string;
    private readonly headers: Headers;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.headers = new Headers({ 'Content-Type': 'application/json' });
    }

    private async createTask(task: HCaptchaTask): Promise<string> {
        const res = await fetch(`${CapSolverClient.BASE_URL}/createTask`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ clientKey: this.apiKey, task }),
        }).then((r) => r.json() as any as BaseResponse);

        if (res.errorId === 1) {
            throw new Error(`CapSolver createTask error: ${res.errorCode} — ${res.errorDescription}`);
        }
        if (!res.taskId) {
            throw new Error('CapSolver: no taskId returned');
        }
        return res.taskId;
    }

    private async pollResult<T extends object>(taskId: string, timeoutMs = 120_000): Promise<T> {
        const deadline = Date.now() + timeoutMs;

        while (Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 3000));

            const res = await fetch(`${CapSolverClient.BASE_URL}/getTaskResult`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ clientKey: this.apiKey, taskId }),
            }).then((r) => r.json() as any as TaskResult<T>);

            if (res.errorId === 1) {
                throw new Error(`CapSolver getTaskResult error: ${res.errorCode} — ${res.errorDescription}`);
            }
            if (res.status === 'ready' && res.solution) {
                return res.solution;
            }
            if (res.status === 'failed') {
                throw new Error(`CapSolver task failed: ${res.errorCode ?? 'unknown'}`);
            }
        }

        throw new Error('CapSolver: timed out waiting for solution');
    }

    async hcaptcha(
        sitekey: string,
        url: string,
        options?: { rqdata?: string; userAgent?: string; isInvisible?: boolean },
    ): Promise<HCaptchaSolution> {
        const task: HCaptchaTask = {
            type: 'HCaptchaTaskProxyless',
            websiteURL: url,
            websiteKey: sitekey,
            userAgent: options?.userAgent,
            isInvisible: options?.isInvisible ?? false,
            enterprisePayload: options?.rqdata ? { rqdata: options.rqdata } : undefined,
        };

        const taskId = await this.createTask(task);
        return this.pollResult<HCaptchaSolution>(taskId);
    }
}
