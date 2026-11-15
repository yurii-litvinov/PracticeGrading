import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test as base, expect, type Page } from '@playwright/test';

export function sql(query: string): string {
    if (process.env.PGDATABASE !== 'practicegrading_e2e' || process.env.PGHOST !== 'postgres') {
        throw new Error('Live tests require the isolated practicegrading-e2e Docker database.');
    }
    return execFileSync('psql', ['-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-c', query], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}
export function rows<T = Record<string, unknown>>(query: string): T[] {
    return JSON.parse(sql(`SELECT coalesce(json_agg(t), '[]'::json) FROM (${query}) t`));
}
export type Demo = {
    users: { id: number; name: string; informationRu: string }[];
    meetings: number[];
};
export const test = base.extend<{ demo: Demo }>({
    demo: async ({}, use) => {
        if (sql('SELECT current_database()') !== 'practicegrading_e2e') throw new Error('Wrong database');
        sql('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
        for (const name of ['init', 'seed']) {
            execFileSync('psql', ['-X', '-q', '-v', 'ON_ERROR_STOP=1'], {
                input: readFileSync(`/fixtures/${name}.sql`), stdio: ['pipe', 'pipe', 'pipe'],
            });
        }
        await use({
            users: rows<Demo['users'][number]>('SELECT "Id" AS id, "UserName" AS name, "InformationRu" AS "informationRu" FROM "Users" WHERE "Email" LIKE \'merge-demo-%@example.test\' ORDER BY "Id"'),
            meetings: rows<{ id: number }>('SELECT "Id" AS id FROM "Meetings" ORDER BY "Id"').map(m => m.id),
        });
    },
});
export { expect };
export const apiURL = process.env.E2E_API_URL ?? 'http://api:8080';

export async function loginAdmin(page: Page) {
    await page.goto('/practice-grading/login');
    await page.getByPlaceholder('Логин', { exact: true }).fill('admin');
    await page.getByPlaceholder('Пароль', { exact: true }).fill('admin');
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await expect(page).toHaveURL(/\/meetings$/);
}
export async function openMerge(page: Page, demo: Demo) {
    await loginAdmin(page);
    await page.goto('/practice-grading/members');
    await page.getByRole('button', { name: 'Объединить пользователей', exact: true }).click();
    await page.locator('#search-input').fill('Тест объединения');
    for (const user of demo.users) {
        await page.locator('.member-search-list').getByText(user.name, { exact: true }).click();
    }
    await page.getByRole('button', { name: 'Настроить объединение', exact: true }).click();
    await expect(page.getByLabel('Сохраняемый ID', { exact: true })).toBeVisible();
}
