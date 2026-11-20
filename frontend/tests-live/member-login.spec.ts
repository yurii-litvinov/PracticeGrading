import { test, expect, sql, loginAdmin } from './fixtures';

for (const existing of [true, false]) {
    test(existing ? 'поиск существующего профиля и вход после одобрения без создания дубля' : 'новый участник создаётся один раз и добавляется в комиссию после одобрения', async ({ page, browser, demo }) => {
        const meetingId = demo.meetings[1];
        const member = demo.users[0];
        const name = existing ? member.name : 'Новый Сквозной Участник';
        sql(`DELETE FROM "MeetingMemberAccesses" WHERE "MemberId"=${member.id} AND "MeetingId"=${meetingId}`);
        const before = Number(sql('SELECT count(*) FROM "Users"'));
        await test.step('Найти себя либо создать новый профиль и отправить заявку', async () => {
            await page.goto(`/practice-grading/meetings/${meetingId}/member/login`);
            await page.getByTestId('member-name-input').fill(existing ? 'Иванов Иван' : name);
            if (existing) {
                await page.locator('[aria-label="Найденные участники"] button').filter({ hasText: `ID: ${member.id}` }).click();
            } else {
                await expect(page.getByText('Участник не найден.', { exact: false })).toBeVisible();
            }
            await page.getByTestId('member-access-submit').click();
            await expect(page.getByTestId('member-access-pending')).toBeVisible();
        });
        const memberId = existing ? member.id : Number(sql(`SELECT "Id" FROM "Users" WHERE "UserName"='${name}'`));
        expect(Number(sql('SELECT count(*) FROM "Users"'))).toBe(before + (existing ? 0 : 1));
        expect(sql(`SELECT count(*) FROM "MeetingUser" WHERE "MembersId"=${memberId} AND "MeetingsId"=${meetingId}`)).toBe('0');
        expect(sql(`SELECT "Status" FROM "MeetingMemberAccesses" WHERE "MemberId"=${memberId} AND "MeetingId"=${meetingId}`)).toBe('0');
        await test.step('Подтвердить заявку в другом браузерном контексте администратора', async () => {
            const adminContext = await browser.newContext({ baseURL: process.env.E2E_BASE_URL });
            try {
                const admin = await adminContext.newPage();
                await loginAdmin(admin);
                await admin.goto(`/practice-grading/meetings/${meetingId}`);
                const row = admin.getByTestId('pending-access-request').filter({ hasText: name });
                await row.getByRole('button', { name: 'Подтвердить', exact: true }).click();
                await expect(row).toHaveCount(0);
            } finally { await adminContext.close(); }
        });
        await test.step('Дождаться входа участника и проверить состав в PostgreSQL', async () => {
            await expect(page).toHaveURL(new RegExp(`/meetings/${meetingId}/member$`));
            expect(sql(`SELECT count(*) FROM "MeetingUser" WHERE "MembersId"=${memberId} AND "MeetingsId"=${meetingId}`)).toBe('1');
            expect(sql(`SELECT "Status" FROM "MeetingMemberAccesses" WHERE "MemberId"=${memberId} AND "MeetingId"=${meetingId}`)).toBe('1');
            expect(Number(sql('SELECT count(*) FROM "Users"'))).toBe(before + (existing ? 0 : 1));
        });
    });
}
