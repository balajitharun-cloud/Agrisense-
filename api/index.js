import { createApiApp } from '../backend/src/api.js';

export default createApiApp({ serveFrontend: false, logging: false });
