import { handle } from '../../../cloudflare/pages/foundation.js';

export const onRequest = context => handle(context);
