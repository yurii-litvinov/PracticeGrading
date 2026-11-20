import { test, expect, sql, rows, openMerge, apiURL } from './fixtures';

test('объединение сохраняет профиль, заседания, заявки, критерии и выбранную доверенную ссылку', async ({ page, demo, request }) => {
    const [target, source] = [demo.users[2], demo.users[1]];
    sql(`UPDATE "StudentWork" SET "FinalMark"='5'`);
    await test.step('Убедиться, что тестовые постоянные ссылки работают до объединения', async () => {
        for (const token of ['merge-demo-trusted-1', 'merge-demo-trusted-2']) {
            const response = await request.post(`${apiURL}/meetings/${demo.meetings[0]}/trusted-login`, {
                headers: { 'X-Trusted-Access-Token': token },
            });
            expect(response.status()).toBe(200);
        }
    });
    const allMarks = rows<{ id: number; work: number; member: number }>('SELECT "Id" AS id, "StudentWorkId" AS work, "MemberId" AS member FROM "MemberMarks" ORDER BY "Id"');
    const groups = new Map<number, typeof allMarks>();
    for (const mark of allMarks) groups.set(mark.work, [...(groups.get(mark.work) ?? []), mark]);
    const retained = [...groups.values()].map(group => group.find(m => m.member === source.id) ?? group.at(-1)!);
    const retainedIds = retained.map(m => m.id);
    const expectedCriteria = rows(`SELECT * FROM "CriteriaMark" WHERE "MemberMarkId" IN (${retainedIds.join(',')}) ORDER BY "Id"`);
    const expectedRules = rows(`SELECT r.* FROM "SelectedRule" r JOIN "CriteriaMark" c ON c."Id"=r."CriteriaMarkId" WHERE c."MemberMarkId" IN (${retainedIds.join(',')}) ORDER BY r."CriteriaMarkId", r."RuleId"`);
    const expectedAccesses = rows(`SELECT "Id", "MeetingId", "Status", "TokenHash" FROM "MeetingMemberAccesses" ORDER BY "Id"`);
    const trustedId = sql(`SELECT "Id" FROM "TrustedMemberAccesses" WHERE "MemberId"=${source.id}`);

    await test.step('Войти администратором и настроить профиль', async () => {
        await openMerge(page, demo);
        await page.getByLabel('Сохраняемый ID', { exact: true }).selectOption(String(target.id));
        await page.getByLabel('Источник name', { exact: true }).selectOption(String(target.id));
        await page.getByLabel('Источник email', { exact: true }).selectOption(String(source.id));
        await page.getByLabel('Источник informationRu', { exact: true }).selectOption(String(source.id));
        await page.locator('#merge-informationRu').fill('Описание после сквозного объединения');
        await expect(page.getByLabel('Источник informationRu', { exact: true })).toHaveValue('');
        await page.getByLabel('Доверенный доступ', { exact: true }).selectOption(trustedId);
    });
    await test.step('Разрешить конфликты и выполнить объединение через настоящий API', async () => {
        const submit = page.getByRole('button', { name: `Объединить в ID ${target.id}`, exact: true });
        await page.getByRole('checkbox', { name: /Подтверждаю выбор данных/ }).check();
        await expect(submit).toBeDisabled();
        for (const mark of retained) {
            if (groups.get(mark.work)!.length > 1) {
                await page.locator(`input[name="work-${mark.work}"]`).nth(groups.get(mark.work)!.findIndex(m => m.id === mark.id)).check();
            }
        }
        const response = page.waitForResponse(r => r.url().endsWith('/members/merge') && r.request().method() === 'POST');
        await submit.click();
        expect((await response).status()).toBe(200);
        await expect(page.getByRole('button', { name: 'Объединить пользователей', exact: true })).toBeVisible();
        await page.reload();
        await expect(page.locator('.member-search-list').getByText(target.name, { exact: true })).toBeVisible();
        await expect(page.locator('.member-search-list').getByText(source.name, { exact: true })).toHaveCount(0);
    });
    await test.step('Проверить результат напрямую в PostgreSQL', async () => {
        expect(sql('SELECT count(*) FROM "Users" WHERE "RoleId"=2')).toBe('1');
        expect(sql(`SELECT "InformationRu" FROM "Users" WHERE "Id"=${target.id}`)).toBe('Описание после сквозного объединения');
        expect(sql(`SELECT "Email" FROM "Users" WHERE "Id"=${target.id}`)).toBe('merge-demo-2@example.test');
        expect(rows('SELECT "MeetingsId" AS id FROM "MeetingUser" ORDER BY "MeetingsId"')).toEqual(demo.meetings.map(id => ({ id })));
        expect(rows('SELECT "Id" AS id, "StudentWorkId" AS work, "MemberId" AS member FROM "MemberMarks" ORDER BY "Id"'))
            .toEqual(retained.map(m => ({ ...m, member: target.id })).sort((a, b) => a.id - b.id));
        expect(rows('SELECT * FROM "CriteriaMark" ORDER BY "Id"')).toEqual(expectedCriteria);
        expect(rows('SELECT * FROM "SelectedRule" ORDER BY "CriteriaMarkId", "RuleId"')).toEqual(expectedRules);
        expect(rows('SELECT "Id", "MeetingId", "Status", "TokenHash" FROM "MeetingMemberAccesses" ORDER BY "Id"')).toEqual(expectedAccesses);
        expect(sql(`SELECT count(*) FROM "MeetingMemberAccesses" WHERE "MemberId"=${target.id}`)).toBe('9');
        expect(sql(`SELECT count(*) FROM "TrustedMemberAccesses" WHERE "Id"=${trustedId} AND "MemberId"=${target.id}`)).toBe('1');
        expect(sql('SELECT count(*) FROM "TrustedMemberAccesses"')).toBe('1');
        for (const [workId, marks] of groups) {
            expect(sql(`SELECT "FinalMark" FROM "StudentWork" WHERE "Id"=${workId}`)).toBe(marks.length > 1 ? '' : '5');
        }
        expect(sql('SELECT count(*) FROM "AverageCriteriaMark" a WHERE a."AverageMark" IS DISTINCT FROM (SELECT round(avg(c."Mark"),1)::double precision FROM "CriteriaMark" c JOIN "MemberMarks" m ON m."Id"=c."MemberMarkId" WHERE m."StudentWorkId"=a."StudentWorkId" AND c."CriteriaId"=a."CriteriaId")')).toBe('0');
    });
    await test.step('Проверить работоспособность сохранённой ссылки и отзыв остальных', async () => {
        const login = (token: string) => request.post(`${apiURL}/meetings/${demo.meetings[0]}/trusted-login`, { headers: { 'X-Trusted-Access-Token': token } });
        expect((await login('merge-demo-trusted-2')).status()).toBe(200);
        expect((await login('merge-demo-trusted-1')).ok()).toBe(false);
        expect((await login('merge-demo-trusted-3')).ok()).toBe(false);
    });
});

test('изменение данных после настройки отклоняет объединение без удаления пользователей', async ({ page, demo }) => {
    await openMerge(page, demo);
    for (const radios of await page.locator('input[type=radio]').evaluateAll(inputs => [...new Set(inputs.map(i => (i as HTMLInputElement).name))])) {
        await page.locator(`input[name="${radios}"]`).first().check();
    }
    sql(`UPDATE "Users" SET "InformationRu"='Изменено другим администратором' WHERE "Id"=${demo.users[1].id}`);
    await page.getByRole('checkbox', { name: /Подтверждаю выбор данных/ }).check();
    await page.getByRole('button', { name: `Объединить в ID ${demo.users[0].id}`, exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Данные изменились');
    expect(sql('SELECT count(*) FROM "Users" WHERE "RoleId"=2')).toBe('3');
    expect(sql('SELECT count(*) FROM "MemberMarks"')).toBe('7');
    expect(sql('SELECT count(*) FROM "TrustedMemberAccesses"')).toBe('3');
});

test('ошибка базы в конце объединения откатывает все изменения', async ({ page, demo }) => {
    sql(`UPDATE "StudentWork" SET "FinalMark"='5'`);
    const tables = ['Users', 'MeetingUser', 'MemberMarks', 'CriteriaMark', 'SelectedRule',
        'MeetingMemberAccesses', 'TrustedMemberAccesses', 'AverageCriteriaMark', 'StudentWork'];
    const snapshot = () => Object.fromEntries(tables.map(table => [table,
        rows(`SELECT to_jsonb(t) AS row FROM "${table}" t ORDER BY to_jsonb(t)::text`)]));
    const before = snapshot();
    await openMerge(page, demo);
    await page.locator('#merge-informationRu').fill('Это изменение должно откатиться');
    const trustedId = sql(`SELECT "Id" FROM "TrustedMemberAccesses" WHERE "MemberId"=${demo.users[1].id}`);
    await page.getByLabel('Доверенный доступ', { exact: true }).selectOption(trustedId);
    for (const name of await page.locator('input[type=radio]').evaluateAll(inputs => [...new Set(inputs.map(i => (i as HTMLInputElement).name))])) {
        await page.locator(`input[name="${name}"]`).first().check();
    }
    sql(`CREATE FUNCTION e2e_fail_delete() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'Injected E2E database failure'; END $$;
        CREATE TRIGGER e2e_fail_delete BEFORE DELETE ON "Users" FOR EACH ROW EXECUTE FUNCTION e2e_fail_delete()`);
    await page.getByRole('checkbox', { name: /Подтверждаю выбор данных/ }).check();
    const response = page.waitForResponse(r => r.url().endsWith('/members/merge') && r.request().method() === 'POST');
    await page.getByRole('button', { name: `Объединить в ID ${demo.users[0].id}`, exact: true }).click();
    expect((await response).status()).toBe(409);
    await expect(page.getByRole('alert')).toBeVisible();
    expect(snapshot()).toEqual(before);
});
