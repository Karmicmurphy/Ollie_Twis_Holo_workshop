import { createHostedHandler, INSTRUCTION } from './hosted-first-job.js';

export { INSTRUCTION };
export const REQUEST = 'request-commissioning-003';
export const MANIFEST = '46e0cb9446779bdcf65dc442897a4775de17dfa04a756af2d8bcd39579550961';
export const { handle, verifyBundle } = createHostedHandler({
  workflow: 'friday-commissioning-003.yml', requestId: REQUEST,
  manifestSha: MANIFEST, envPrefix: 'FRIDAY_THIRD',
  allowStatusQuery: true,
});
