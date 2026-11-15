import { expect, test } from '@playwright/test';

const members = [
    { id: 21, name: 'Иванов Первый', informationRu: 'Описание первого', meetingIds: [1] },
    { id: 22, name: 'Иванов Второй', informationRu: 'Описание второго', meetingIds: [1, 2] },
];

test('merges selected members with an explicit profile, trusted link and conflict choice', async ({ page }) => {
    await page.route('**/members?*', route => route.fulfill({ json: { members, hasMore: false } }));
    await page.route('**/members/merge/preview', route => route.fulfill({ json: {
        version: 'preview-version', data: { members,
            marks: [
                { id: 101, memberId: 21, studentWorkId: 7, studentName: 'Петров', mark: 3, comment: 'Первая', criteria: [] },
                { id: 102, memberId: 22, studentWorkId: 7, studentName: 'Петров', mark: 5, comment: 'Вторая', criteria: [] },
            ], accesses: [], trustedAccesses: [{ id: 12, memberId: 22, createdAt: '2026-11-10T10:00:00Z', revokedAt: null }],
        },
    } }));
    let submitted: Record<string, unknown> | undefined;
    await page.route('**/members/merge', route => {
        submitted = route.request().postDataJSON();
        return route.fulfill({ json: { id: 21 } });
    });
    await page.goto('/practice-grading/members');
    await page.getByRole('button', { name: 'Объединить пользователей', exact: true }).click();
    await page.locator('.member-search-list').getByText('Иванов Первый', { exact: true }).click();
    await page.locator('.member-search-list').getByText('Иванов Второй', { exact: true }).click();
    await page.getByRole('button', { name: 'Настроить объединение', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Объединить в ID 21' })).toBeDisabled();
    for (const key of ['name', 'email', 'phone', 'informationRu', 'informationEn']) {
        const source = page.getByLabel(`Источник ${key}`, { exact: true });
        const input = page.locator(`#merge-${key}`);
        await expect(source).toHaveValue('21');
        await source.selectOption('22');
        await input.fill(`Изменено вручную: ${key}`);
        await expect(source).toHaveValue('');
        await expect(source.locator('option:checked')).toHaveText('Изменено вручную');
        await source.selectOption('21');
        await expect(source).toHaveValue('21');
        await expect(input).toHaveValue(key === 'name' ? 'Иванов Первый' : key === 'informationRu' ? 'Описание первого' : '');
    }
    await page.getByLabel('Источник informationRu').selectOption('22');
    await expect(page.locator('#merge-informationRu')).toHaveValue('Описание второго');
    await page.getByLabel('Доверенный доступ', { exact: true }).selectOption('12');
    await page.getByRole('radio', { name: /Иванов Второй/ }).check();
    await page.getByRole('checkbox', { name: /Подтверждаю выбор данных/ }).check();
    await page.getByRole('button', { name: 'Объединить в ID 21' }).click();
    await expect(page.getByRole('button', { name: 'Объединить пользователей', exact: true })).toBeVisible();
    expect(submitted).toMatchObject({ memberIds: [21, 22], targetId: 21, trustedAccessId: 12,
        profile: { name: 'Иванов Первый', informationRu: 'Описание второго' }, markChoices: { '7': 102 }, version: 'preview-version' });
});
