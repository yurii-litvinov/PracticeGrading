import {test, expect} from '@playwright/test'

const BASENAME = "/practice-grading"

const login = async (page) => {
    await page.goto(BASENAME);
    await expect(page).toHaveURL(`${BASENAME}/login`)

    await page.fill('#username', 'admin');
    await page.fill('#password', 'admin');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(`${BASENAME}/meetings`);
}

const createCriteria = async (page, name, comment) => {
    await page.click('#criteria-link');
    await expect(page).toHaveURL(`${BASENAME}/criteria`);

    await page.click('#add-criteria');
    await page.waitForSelector('#criteriaModal', {state: 'visible'});
    await page.fill('input[name="name"]', name);
    await page.fill('textarea[name="comment"]', comment);
    await page.click('#save-criteria');
}

const createMeeting = async (page, info) => {
    await page.click('#create-meeting');
    await expect(page).toHaveURL(`${BASENAME}/meetings/new`);

    await page.fill('input[name="auditorium"]', '3389');
    await page.fill('input[name="info"]', info);
    await page.fill('#member:nth-of-type(1)', 'член комиссии 1');

    await page.click('#add-student');
    await page.waitForSelector('#studentWorkModal', {state: 'visible'});
    await page.fill('input[name="studentName"]', 'студент');
    await page.fill('input[name="theme"]', 'тема');
    await page.fill('input[name="supervisor"]', 'научник');
    await page.click('#save-student');

    await page.click('input[name="criteria-0"] + label');

    await page.click('#save-meeting');
}


test('admin login', async ({page}) => {
    await login(page);
});

test('admin logout', async ({page}) => {
    await login(page);

    await page.click('#profile-link');
    await expect(page).toHaveURL(`${BASENAME}/profile`);
    await page.click('#exit');

    await expect(page).toHaveURL(`${BASENAME}/login`);
    const sessionStorageValue = await page.evaluate(() => {
        return sessionStorage.getItem('token');
    });
    expect(sessionStorageValue).toBe(null);
});

test('create meeting', async ({page}) => {
    await login(page);

    await createCriteria(page, 'критерий', 'комментарий');

    await page.click('#meetings-link');
    await expect(page).toHaveURL(`${BASENAME}/meetings`);

    await createMeeting(page, 'заседание');

    await expect(page).toHaveURL(`${BASENAME}/meetings`);
    await expect(page.locator('#info')).toHaveText('заседание');

    page.on('dialog', dialog => dialog.accept());
    await page.click('#delete-meeting');

    await page.click('#criteria-link');
    await expect(page).toHaveURL(`${BASENAME}/criteria`);

    await page.click('#delete-criteria');
});
