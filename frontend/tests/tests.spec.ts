/// <reference types="node" />

import { expect, test, type Page } from "@playwright/test";

const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME ?? "admin";

const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin";

const BASENAME = "/practice-grading";

test.setTimeout(60_000);

type MemberInfo = {
    name: string;
    email: string;
    phone: string;
    informationRu: string;
    informationEn: string;
};

const createUniqueSuffix = () =>
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const login = async (page: Page) => {
    await page.goto(`${BASENAME}/login`);

    await page.fill("#username", ADMIN_USERNAME);

    await page.fill("#password", ADMIN_PASSWORD);

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(`${BASENAME}/meetings`);
};

const getMemberCard = (page: Page, memberName: string) =>
    page.locator(".card").filter({
        hasText: memberName,
    });

const getMeetingCard = (page: Page, meetingInfo: string) =>
    page.locator(".card").filter({
        hasText: meetingInfo,
    });

const getCriteriaCard = (page: Page, criteriaName: string) =>
    page.locator("h2").filter({
        hasText: criteriaName,
    });

const findMemberCard = async (page: Page, memberName: string) => {
    const searchInput = page.locator("#search-input");

    await searchInput.fill("");
    await searchInput.fill(memberName);

    const memberCard = getMemberCard(page, memberName);

    await expect(memberCard).toHaveCount(1);

    return memberCard;
};

const createTestMember = async (page: Page, info: MemberInfo) => {
    await page.goto(`${BASENAME}/members`);

    await page.locator("#search-input").fill(info.name);

    await page.locator("#add-member-button").click();

    await page.locator("input[name=email]").fill(info.email);

    await page.locator("input[name=phone]").fill(info.phone);

    await page
        .locator("textarea[name=information-ru]")
        .fill(info.informationRu);

    await page
        .locator("textarea[name=information-en]")
        .fill(info.informationEn);

    await page.locator("#form-submit-button").click();

    await expect(getMemberCard(page, info.name)).toHaveCount(1);
};

const deleteMemberIfExists = async (page: Page, memberName: string) => {
    await page.goto(`${BASENAME}/members`);

    await page.locator("#search-input").fill(memberName);

    const memberCard = getMemberCard(page, memberName);

    if ((await memberCard.count()) === 0) {
        return;
    }

    await expect(memberCard).toHaveCount(1);
    await memberCard.click();

    page.once("dialog", async (dialog) => {
        await dialog.accept();
    });

    await page.locator("#delete-member-button").click();

    await expect(memberCard).toHaveCount(0);
};

const createCriteria = async (page: Page, name: string, comment: string) => {
    await page.goto(`${BASENAME}/criteria`);

    await page.locator("#add-criteria").click();

    const criteriaModal = page.locator("#criteriaModal");

    await expect(criteriaModal).toBeVisible();

    await criteriaModal.locator('input[name="name"]').fill(name);

    await criteriaModal.locator('textarea[name="comment"]').fill(comment);

    await criteriaModal.locator("#save-criteria").click();

    await expect(criteriaModal).toBeHidden();

    await expect(getCriteriaCard(page, name)).toHaveCount(1);
};

const deleteCriteriaIfExists = async (
    page: Page,
    criteriaName: string,
) => {
    await page.goto(`${BASENAME}/criteria`);

    await page
        .getByRole('tab', {
            name: 'Все критерии',
            exact: true,
        })
        .click();

    const criteriaCard =
        getCriteriaCard(page, criteriaName);

    if (await criteriaCard.count() === 0) {
        return;
    }

    await expect(criteriaCard).toBeVisible();

    page.once('dialog', async dialog => {
        await dialog.accept();
    });

    await criteriaCard
        .locator('#delete-criteria')
        .click();

    await expect(criteriaCard).toHaveCount(0);
};

const createMeeting = async (
    page: Page,
    meetingInfo: string,
    memberName: string,
    criteriaName: string,
) => {
    await page.goto(`${BASENAME}/meetings/new`);

    await page.locator('input[name="auditorium"]').fill("3389");

    await page.locator('input[name="info"]:visible').fill(meetingInfo);

    await page.locator("#add-student").click();

    await expect(page.locator("#studentWorkModal")).toBeVisible();

    await page.locator('input[name="studentName"]').fill("E2E student");

    await page.locator('input[name="theme"]').fill("E2E theme");

    await page.locator('input[name="supervisor"]').fill("E2E supervisor");

    await page.locator("#save-student").click();

    await page.locator("#search-input").fill(memberName);

    const memberOption = page.locator(".dropdown-item").filter({
        hasText: memberName,
    });

    await expect(memberOption).toHaveCount(1);
    await memberOption.click();

    const criteriaGroupInput = page.locator('input[name^="criteria-"]').first();

    const criteriaGroupLabel = criteriaGroupInput.locator("+ label");

    await expect(criteriaGroupLabel).toBeVisible();

    await criteriaGroupLabel.click();

    await expect(criteriaGroupInput).toBeChecked();

    const saveResponsePromise = page.waitForResponse(
        (response) =>
            response.request().method() === "POST" &&
            response.url().includes("/meetings/new"),
    );

    await page.locator("#save-meeting").click();

    const saveResponse = await saveResponsePromise;

    expect(
        saveResponse.ok(),
        `Meeting creation returned ` +
            `${saveResponse.status()} ` +
            saveResponse.statusText(),
    ).toBeTruthy();

    await page.goto(`${BASENAME}/meetings`);

    await expect(page).toHaveURL(
        `${BASENAME}/meetings`,
    );

    await expect(
        getMeetingCard(page, meetingInfo),
    ).toHaveCount(1);
};

const deleteMeetingIfExists = async (page: Page, meetingInfo: string) => {
    await page.goto(`${BASENAME}/meetings`);

    const meetingCard = getMeetingCard(page, meetingInfo);

    if ((await meetingCard.count()) === 0) {
        return;
    }

    await expect(meetingCard).toHaveCount(1);

    page.once("dialog", async (dialog) => {
        await dialog.accept();
    });

    await meetingCard.locator("#delete-meeting").click();

    await expect(meetingCard).toHaveCount(0);
};

test("admin login", async ({ page }) => {
    await login(page);
});

test("admin logout", async ({ page }) => {
    await login(page);

    await page.locator("#profile-link").click();

    await expect(page).toHaveURL(`${BASENAME}/profile`);

    await page.locator("#exit").click();

    await expect(page).toHaveURL(`${BASENAME}/login`);

    const token = await page.evaluate(() => sessionStorage.getItem("token"));

    expect(token).toBeNull();
});

test("create meeting", async ({ page }) => {
    const suffix = createUniqueSuffix();

    const memberInfo: MemberInfo = {
        name: `E2E meeting member ${suffix}`,
        email: `meeting-${suffix}@example.com`,
        phone: "77777777777",
        informationRu: "Тестовая информация",
        informationEn: "Test information",
    };

    const criteriaName = `E2E criteria ${suffix}`;

    const meetingInfo = `E2E meeting ${suffix}`;

    await login(page);

    try {
        await createTestMember(page, memberInfo);

        await createCriteria(page, criteriaName, `E2E comment ${suffix}`);

        await createMeeting(page, meetingInfo, memberInfo.name, criteriaName);

        const meetingCard = getMeetingCard(page, meetingInfo);

        await expect(meetingCard).toHaveCount(1);

        await expect(
            meetingCard.getByText(meetingInfo, {
                exact: true,
            }),
        ).toBeVisible();
    } finally {
        await deleteMeetingIfExists(page, meetingInfo);

        await deleteCriteriaIfExists(page, criteriaName);

        await deleteMemberIfExists(page, memberInfo.name);
    }
});

test("create and delete new user", async ({ page }) => {
    const suffix = createUniqueSuffix();

    const memberInfo: MemberInfo = {
        name: `E2E created member ${suffix}`,
        email: `created-${suffix}@example.com`,
        phone: "77777777777",
        informationRu: "Тестовая информация",
        informationEn: "Test information",
    };

    await login(page);

    try {
        await createTestMember(page, memberInfo);

        const memberCard = await findMemberCard(page, memberInfo.name);

        await memberCard.click();

        await expect(page.locator("input[name=name]")).toHaveValue(
            memberInfo.name,
        );

        await expect(page.locator("input[name=email]")).toHaveValue(
            memberInfo.email,
        );

        await expect(page.locator("input[name=phone]")).toHaveValue(
            memberInfo.phone,
        );

        await expect(page.locator("textarea[name=information-ru]")).toHaveValue(
            memberInfo.informationRu,
        );

        await expect(page.locator("textarea[name=information-en]")).toHaveValue(
            memberInfo.informationEn,
        );

        page.once("dialog", async (dialog) => {
            expect(dialog.type()).toBe("confirm");

            await dialog.accept();
        });

        await page.locator("#delete-member-button").click();

        await page.locator("#search-input").fill(memberInfo.name);

        await expect(getMemberCard(page, memberInfo.name)).toHaveCount(0);
    } finally {
        await deleteMemberIfExists(page, memberInfo.name);
    }
});

test("edit user", async ({ page }) => {
    const suffix = createUniqueSuffix();

    const originalInfo: MemberInfo = {
        name: `E2E edit member ${suffix}`,
        email: `edit-${suffix}@example.com`,
        phone: "77777777777",
        informationRu: "Исходная информация",
        informationEn: "Original information",
    };

    const editedInfo: MemberInfo = {
        name: `E2E edited member ${suffix}`,
        email: `edited-${suffix}@example.com`,
        phone: "79999999999",
        informationRu: "Изменённая информация",
        informationEn: "Edited information",
    };

    await login(page);

    try {
        await createTestMember(page, originalInfo);

        const originalCard = await findMemberCard(page, originalInfo.name);

        await originalCard.click();

        await page.locator("input[name=name]").fill(editedInfo.name);

        await page.locator("input[name=email]").fill(editedInfo.email);

        await page.locator("input[name=phone]").fill(editedInfo.phone);

        await page
            .locator("textarea[name=information-ru]")
            .fill(editedInfo.informationRu);

        await page
            .locator("textarea[name=information-en]")
            .fill(editedInfo.informationEn);

        await page.locator("#form-submit-button").click();

        const editedCard = await findMemberCard(page, editedInfo.name);

        await editedCard.click();

        await expect(page.locator("input[name=name]")).toHaveValue(
            editedInfo.name,
        );

        await expect(page.locator("input[name=email]")).toHaveValue(
            editedInfo.email,
        );

        await expect(page.locator("input[name=phone]")).toHaveValue(
            editedInfo.phone,
        );

        await expect(page.locator("textarea[name=information-ru]")).toHaveValue(
            editedInfo.informationRu,
        );

        await expect(page.locator("textarea[name=information-en]")).toHaveValue(
            editedInfo.informationEn,
        );
    } finally {
        await deleteMemberIfExists(page, editedInfo.name);

        await deleteMemberIfExists(page, originalInfo.name);
    }
});