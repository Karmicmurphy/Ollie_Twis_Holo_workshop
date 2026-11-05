import { handle } from '../../../cloudflare/pages/hosted-first-job.js';

export const onRequest = context => handle(context);
