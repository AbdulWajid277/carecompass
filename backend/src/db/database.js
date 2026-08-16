import { initStore, count } from './jsonStore.js';

export function initSchema() {
  initStore();
}

export default {
  countResources: () => count('resources'),
};
