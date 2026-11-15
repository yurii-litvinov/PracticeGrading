import { defineConfig, mergeConfig } from 'vite';
import appConfig from '../vite.config';

export default mergeConfig(appConfig, defineConfig({
    server: { allowedHosts: ['frontend'] },
}));
