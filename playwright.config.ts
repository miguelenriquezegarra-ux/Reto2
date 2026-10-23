import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'tests/browser',workers:1,use:{baseURL:'http://127.0.0.1:3101'},webServer:{command:'npx tsx tests/support/browser-server.ts',url:'http://127.0.0.1:3101',reuseExistingServer:false},reporter:'list'});
