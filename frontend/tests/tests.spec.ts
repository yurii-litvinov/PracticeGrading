import { test, expect } from '@playwright/test'

const BASENAME = "/practice-grading"

const login = async (page) => {
    await page.goto(`${BASENAME}/`);
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
    await page.waitForSelector('#criteriaModal', { state: 'visible' });
    await page.fill('input[name="name"]', name);
    await page.fill('textarea[name="comment"]', comment);
    await page.click('#save-criteria');
}

const createMeeting = async (page, info) => {
    await page.click('#create-meeting');
    await expect(page).toHaveURL(`${BASENAME}/meetings/new`);

    await page.fill('input[name="auditorium"]', '3389');
    await page.fill('input[name="info"]', info);

    await page.click('#add-student');
    await page.waitForSelector('#studentWorkModal', { state: 'visible' });
    await page.fill('input[name="studentName"]', 'студент');
    await page.fill('input[name="theme"]', 'тема');
    await page.fill('input[name="supervisor"]', 'научник');
    await page.click('#save-student');

    await page.fill('#searchInput', 'testMember')

    await page.waitForSelector('.dropdown-item');
    await page.click('.dropdown-item');
    await page.click('#add-member-button')

    await page.click('input[name="criteria-0"] + label');

    await page.click('#save-meeting');
}

const addTestMember = async (page, name: string) => {
    const id = await page.evaluate(async (name: string) => {
        const token = window.sessionStorage.getItem('token');
        const response = await fetch('http://localhost:5183/members', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: name,
            })
        });

        if (!response.ok) {
            throw new Error(`Failed: ${response.status}`);
        }

        const membersGetResponse = await fetch(`http://localhost:5183/members?searchName=${name}&offset=0&limit=1`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        })
        const members = (await membersGetResponse.json()).members;

        return members[0].id
    }, name);

    return id;
}

const deleteTestMember = async (page, id: number) => {
    await page.evaluate(async (id: number) => {
        const token = window.sessionStorage.getItem('token');
        const response = await fetch(`http://localhost:5183/members?id=${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to delete member: ${response.status}`);
        }
    }, id);
}

const createTestMember = async (page, info) => {
    await page.fill('#searchInput', info.name);
    await page.click("#add-member-button");
    await page.fill('input[name=email]', info.email);
    await page.fill('input[name=phone]', info.phone)
    await page.fill('textarea[name=informationRu]', info.informationRu)
    await page.fill('textarea[name=informationEn]', info.informationEn);
    await page.click('#form-submit-button');
}

test('admin login', async ({ page }) => {
    await login(page);
});

test('admin logout', async ({ page }) => {
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

test('create meeting', async ({ page }) => {
    await login(page);
    const id = await addTestMember(page, 'testMember');

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
    await deleteTestMember(page, id);
});

test('create and delete new user', async ({ page }) => {
    const info = {
        name: 'testCreatedMember',
        email: 'email@gmail.com',
        phone: '77777777777',
        informationRu: 'Информация',
        informationEn: 'Information'
    }

    await login(page);
    await page.click('#members-link');
    await createTestMember(page, info);

    await page.fill('#searchInput', '');
    await page.fill('#searchInput', info.name);

    await page.waitForSelector('.dropdown-item');
    await page.click('.dropdown-item');

    await expect(page.locator('input[name=name]')).toHaveValue(info.name);
    await expect(page.locator('input[name=email]')).toHaveValue(info.email);
    await expect(page.locator('input[name=phone]')).toHaveValue(info.phone);
    await expect(page.locator('textarea[name=informationRu]')).toHaveValue(info.informationRu);
    await expect(page.locator('textarea[name=informationEn]')).toHaveValue(info.informationEn);

    await page.click("#delete-member-button");

    await page.fill('#searchInput', '');
    await page.fill('#searchInput', 'testMember');

    await expect(page.locator('input[name=name]')).toHaveValue('');
    await expect(page.locator('input[name=email]')).toHaveValue('');
    await expect(page.locator('input[name=phone]')).toHaveValue('');
    await expect(page.locator('textarea[name=informationRu]')).toHaveValue('');
    await expect(page.locator('textarea[name=informationEn]')).toHaveValue('');
})

test('edit user', async ({ page }) => {
    const info = {
        name: 'testEditMember',
        email: 'email@gmail.com',
        phone: '77777777777',
        informationRu: 'Информация',
        informationEn: 'Information'
    }

    await login(page);
    await page.click('#members-link');

    await createTestMember(page, info);

    await page.click("#edit-member-button");
    await page.fill('input[name=name]', info.name + '..');
    await page.fill('input[name=email]', info.email + 'mm');
    await page.fill('input[name=phone]', info.phone + '..')
    await page.fill('textarea[name=informationRu]', info.informationRu + '..')
    await page.fill('textarea[name=informationEn]', info.informationEn + '..');
    await page.click('#form-submit-button');

    await page.fill('#searchInput', '');
    await page.fill('#searchInput', info.name + '..')
    await page.waitForSelector('.dropdown-item');
    await page.click('.dropdown-item');

    await expect(page.locator('input[name=name]')).toHaveValue(info.name + '..');
    await expect(page.locator('input[name=email]')).toHaveValue(info.email + 'mm');
    await expect(page.locator('input[name=phone]')).toHaveValue(info.phone + '..');
    await expect(page.locator('textarea[name=informationRu]')).toHaveValue(info.informationRu + '..');
    await expect(page.locator('textarea[name=informationEn]')).toHaveValue(info.informationEn + '..');

    await page.click("#delete-member-button");
});
