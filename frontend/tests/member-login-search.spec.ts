import { expect, test, type Page, type Route } from '@playwright/test';

const meetingId = 4242;
const loginUrl = `/practice-grading/meetings/${meetingId}/member/login`;
const searchRoute = `**/meetings/${meetingId}/member-candidates?*`;
const requestRoute = `**/meetings/${meetingId}/access-requests`;
const candidate = { id: 77, name: 'Иванов Иван Иванович' };

async function openLogin(page: Page, members: { id: number; name: string }[] = []) {
    await page.route('**/meetings/members?*', route => route.fulfill({ json: members }));
    await page.route(`**/meetings/${meetingId}/access-requests/status`, route =>
        route.fulfill({ json: { status: 0, memberId: 77, meetingId } }));
    await page.route(`**/meetings/${meetingId}/read-only`, route => route.fulfill({
        json: { id: meetingId, dateAndTime: '2026-11-09T12:00:00Z', studentWorks: [] },
    }));
    await page.goto(loginUrl);
    await expect(page.getByTestId('member-name-input')).toBeVisible();
}

test('selects an existing member outside the commission and requests approval by ID', async ({ page }) => {
    await page.route(searchRoute, route => route.fulfill({ json: { members: [candidate], hasMore: false } }));
    let submitted: unknown;
    await page.route(requestRoute, route => {
        submitted = route.request().postDataJSON();
        return route.fulfill({ json: { token: 'pending-token' } });
    });
    await openLogin(page);
    await page.getByTestId('member-name-input').fill('Иванов');
    await expect(page.getByRole('button', { name: /Иванов Иван Иванович/ })).toBeVisible();
    await expect(page.getByTestId('member-access-submit')).toBeDisabled();
    await page.getByRole('button', { name: /Иванов Иван Иванович/ }).click();
    await page.getByTestId('member-access-submit').click();
    await expect(page.getByTestId('member-access-pending')).toBeVisible();
    expect(submitted).toEqual({ memberId: 77 });
    expect(await page.evaluate(() => sessionStorage.getItem('token'))).toBeNull();
});

test('allows creation only after a successful search with no results', async ({ page }) => {
    let releaseSearch!: () => void;
    const holdSearch = new Promise<void>(resolve => { releaseSearch = resolve; });
    await page.route(searchRoute, async route => {
        await holdSearch;
        await route.fulfill({ json: { members: [], hasMore: false } });
    });
    let submitted: unknown;
    await page.route(requestRoute, route => {
        submitted = route.request().postDataJSON();
        return route.fulfill({ json: { token: 'new-token' } });
    });
    await openLogin(page);
    await page.getByTestId('member-name-input').fill('Новый Участник');
    await expect(page.getByTestId('member-access-submit')).toBeDisabled();
    await page.getByTestId('member-name-input').press('Enter');
    expect(submitted).toBeUndefined();
    releaseSearch();
    await expect(page.getByText('Участник не найден.', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Создать участника и отправить запрос' }).click();
    await expect(page.getByTestId('member-access-pending')).toBeVisible();
    expect(submitted).toEqual({ memberId: 0, userName: 'Новый Участник' });
});

test('does not permit creation on search failure and supports retry', async ({ page }) => {
    let fail = true;
    await page.route(searchRoute, route => route.fulfill(fail
        ? { status: 503, json: { error: 'unavailable' } }
        : { json: { members: [candidate], hasMore: false } }));
    await openLogin(page);
    await page.getByTestId('member-name-input').fill('Иванов');
    await expect(page.getByText('Не удалось выполнить поиск.', { exact: false })).toBeVisible();
    await expect(page.getByTestId('member-access-submit')).toBeDisabled();
    fail = false;
    await page.getByRole('button', { name: 'Повторить поиск' }).click();
    await expect(page.getByRole('button', { name: /Иванов Иван Иванович/ })).toBeVisible();
});

test('refreshes suggestions when another request has already created the same name', async ({ page }) => {
    let createdElsewhere = false;
    await page.route(searchRoute, route => route.fulfill({
        json: { members: createdElsewhere ? [candidate] : [], hasMore: false },
    }));
    await page.route(requestRoute, route => {
        createdElsewhere = true;
        return route.fulfill({ status: 409, json: { code: 'member_already_exists' } });
    });
    await openLogin(page);
    await page.getByTestId('member-name-input').fill(candidate.name);
    await page.getByRole('button', { name: 'Создать участника и отправить запрос' }).click();
    await expect(page.getByText('Участник с таким ФИО уже существует.', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: /Иванов Иван Иванович/ })).toBeVisible();
    await expect(page.getByTestId('member-access-submit')).toBeDisabled();
});

test('loads more matching identities instead of creating a new user', async ({ page }) => {
    await page.route(searchRoute, route => {
        const offset = new URL(route.request().url()).searchParams.get('offset');
        return route.fulfill({ json: offset === '0'
            ? { members: [candidate], hasMore: true }
            : { members: [{ id: 78, name: 'Иванов Пётр Петрович' }], hasMore: false } });
    });
    await openLogin(page);
    await page.getByTestId('member-name-input').fill('Иванов');
    await page.getByRole('button', { name: 'Показать ещё' }).click();
    await expect(page.getByRole('button', { name: /Иванов Пётр Петрович/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Иванов Иван Иванович/ })).toBeVisible();
    await expect(page.getByTestId('member-access-submit')).toBeDisabled();
});

test('changing a selected name clears the identity and waits for a fresh search', async ({ page }) => {
    let releaseSearch!: () => void;
    const holdSearch = new Promise<void>(resolve => { releaseSearch = resolve; });
    await page.route(searchRoute, async route => {
        const name = new URL(route.request().url()).searchParams.get('searchName');
        if (name === 'Петров') {
            await holdSearch;
            await route.fulfill({ json: { members: [], hasMore: false } });
        } else {
            await route.fulfill({ json: { members: [candidate], hasMore: false } });
        }
    });
    await openLogin(page);
    await page.getByTestId('member-name-input').fill('Иванов');
    await page.getByRole('button', { name: /Иванов Иван Иванович/ }).click();
    await expect(page.getByTestId('member-access-submit')).toBeEnabled();
    await page.getByTestId('member-name-input').fill('Петров');
    await expect(page.getByTestId('member-access-submit')).toBeDisabled();
    releaseSearch();
    await expect(page.getByRole('button', { name: 'Создать участника и отправить запрос' })).toBeEnabled();
});

test('discards late results from a previous name', async ({ page }) => {
    let delayedRoute!: Route;
    await page.route(searchRoute, async route => {
        if (new URL(route.request().url()).searchParams.get('searchName') === 'Иванов') {
            delayedRoute = route;
        } else {
            await route.fulfill({ json: { members: [{ id: 88, name: 'Петров Пётр' }], hasMore: false } });
        }
    });
    await openLogin(page);
    await page.getByTestId('member-name-input').fill('Иванов');
    await expect.poll(() => Boolean(delayedRoute)).toBeTruthy();
    await page.getByTestId('member-name-input').fill('Петров');
    await expect(page.getByRole('button', { name: /Петров Пётр/ })).toBeVisible();
    await delayedRoute.fulfill({ json: { members: [], hasMore: false } }).catch(() => {});
    await expect(page.getByRole('button', { name: /Петров Пётр/ })).toBeVisible();
    await expect(page.getByTestId('member-access-submit')).toBeDisabled();
});

test('commission members can still request access directly without searching', async ({ page }) => {
    let searches = 0;
    await page.route(searchRoute, route => {
        searches++;
        return route.fulfill({ json: { members: [], hasMore: false } });
    });
    let submitted: unknown;
    await page.route(requestRoute, route => {
        submitted = route.request().postDataJSON();
        return route.fulfill({ json: { token: 'commission-token' } });
    });
    await openLogin(page, [candidate]);
    await expect(page.getByRole('combobox')).toHaveValue('0');
    await page.getByRole('combobox').selectOption('77');
    await page.getByTestId('member-access-submit').click();
    await expect(page.getByTestId('member-access-pending')).toBeVisible();
    expect(submitted).toEqual({ memberId: 77 });
    expect(searches).toBe(0);
});

test('a delayed commission list does not replace the identity being searched', async ({ page }) => {
    let releaseMembers!: () => void;
    const holdMembers = new Promise<void>(resolve => { releaseMembers = resolve; });
    await page.route('**/meetings/members?*', async route => {
        await holdMembers;
        await route.fulfill({ json: [{ id: 99, name: 'Другой участник комиссии' }] });
    });
    await page.route(searchRoute, route => route.fulfill({ json: { members: [candidate], hasMore: false } }));
    await page.goto(loginUrl);
    await page.getByTestId('member-name-input').fill('Иванов');
    await expect(page.getByRole('button', { name: /Иванов Иван Иванович/ })).toBeVisible();
    releaseMembers();
    await expect(page.getByRole('combobox').getByRole('option', { name: 'Другой участник комиссии' })).toBeAttached();
    await expect(page.getByRole('combobox')).toHaveValue('0');
    await expect(page.getByRole('button', { name: /Иванов Иван Иванович/ })).toBeVisible();
    await expect(page.getByTestId('member-access-submit')).toBeDisabled();
});
