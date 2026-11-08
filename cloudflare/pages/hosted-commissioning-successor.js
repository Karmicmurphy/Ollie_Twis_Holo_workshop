import { createHostedHandler, INSTRUCTION } from './hosted-first-job.js';

export { INSTRUCTION };
export const REQUEST = 'request-commissioning-002';
export const MANIFEST = 'b160b07429a29e7fe8fe7aa1c237da7dc519fb18201b71b468ee2863c01c1d7b';
export const { handle, verifyBundle } = createHostedHandler({
  workflow: 'friday-commissioning-002.yml', requestId: REQUEST,
  manifestSha: MANIFEST, envPrefix: 'FRIDAY_SUCCESSOR',
});
