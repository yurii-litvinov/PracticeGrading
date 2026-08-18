/// <reference types="node" />

import {
    expect as playwrightExpect,
    test,
    type Dialog,
    type Locator,
    type Page,
    type Response,
} from "@playwright/test";

const expect = playwrightExpect.configure({
    timeout: 20_000,
});

const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME ?? "admin";

const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin";

const BASENAME = "/practice-grading";

const waitForMemberSearch = (
    page: Page,
    searchName: string,
) =>
    page.waitForResponse(
        response => {
            const url = new URL(response.url());

            return response.request().method() === "GET" &&
                url.pathname.endsWith("/members") &&
                url.searchParams.get("searchName") === searchName;
        },
        { timeout: 20_000 },
    );

const waitForApiResponse = (
    page: Page,
    method: string,
    pathMatches: (path: string) => boolean,
) =>
    page.waitForResponse(
        response =>
            response.request().method() === method &&
            pathMatches(new URL(response.url()).pathname),
        { timeout: 20_000 },
    );


const waitForElementIfExists = async (
    locator: Locator,
    timeout = 5_000,
) => {
    try {
        await locator.waitFor({
            state: "attached",
            timeout,
        });

        return true;
    } catch {
        return false;
    }
};

const waitForBootstrapModalToOpen = async (
    modal: Locator,
    openAction: () => Promise<void>,
) => {
    await modal.evaluate(element => {
        element.removeAttribute('data-e2e-shown');

        element.addEventListener(
            'shown.bs.modal',
            () => {
                element.setAttribute(
                    'data-e2e-shown',
                    'true',
                );
            },
            { once: true },
        );
    });

    await openAction();

    await expect(modal)
        .toHaveAttribute('data-e2e-shown', 'true');
};

const expectSuccessfulResponse = async (
    response: Response,
    operation: string,
) => {
    if (response.ok()) {
        return;
    }

    const body = await response
        .text()
        .catch(() => "<response body unavailable>");

    expect(
        response.ok(),
        `${operation} returned ${response.status()}: ${body}`,
    ).toBeTruthy();
};

const performWithAcceptedConfirm = async (
    page: Page,
    action: () => Promise<unknown>,
) => {
    let timeoutId:
        ReturnType<typeof setTimeout> | undefined;

    let handleDialog:
        ((dialog: Dialog) => void) | undefined;

    const dialogPromise = new Promise<void>(
        (resolve, reject) => {
            handleDialog = dialog => {
                void (async () => {
                    try {
                        const dialogType = dialog.type();

                        await dialog.accept();

                        expect(dialogType).toBe("confirm");
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                })();
            };

            page.once("dialog", handleDialog);

            timeoutId = setTimeout(
                () => reject(new Error(
                    "The confirmation dialog did not appear.",
                )),
                20_000,
            );
        },
    );

    try {
        await Promise.all([
            action(),
            dialogPromise,
        ]);
    } finally {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }

        if (handleDialog !== undefined) {
            page.off("dialog", handleDialog);
        }
    }
};

const bestEffortCleanup = async (
    operation: string,
    cleanup: () => Promise<void>,
) => {
    try {
        await cleanup();
    } catch (error) {
        console.warn(`Cleanup failed (${operation}): ${String(error)}`);
    }
};

const navigateForCleanup = async (
    page: Page,
    url: string,
) => {
    if (page.isClosed()) {
        return false;
    }

    try {
        await page.goto(url, {
            timeout: 20_000,
            waitUntil: "domcontentloaded",
        });

        return true;
    } catch (error) {
        const message = String(error);

        if (
            page.isClosed() ||
            message.includes("has been closed") ||
            message.includes("Target page") ||
            message.includes("Test ended")
        ) {
            return false;
        }

        throw error;
    }
};

const waitForModalToClose = async (
    page: Page,
    modal: Locator,
) => {
    try {
        await Promise.all([
            expect(modal).toBeHidden({ timeout: 5_000 }),
            expect(page.locator(".modal-backdrop")).toHaveCount(0, {
                timeout: 5_000,
            }),
        ]);

        return;
    } catch {
    }

    const dismissButton = modal
        .locator('[data-bs-dismiss="modal"]')
        .first();

    if (await dismissButton.count()) {
        await dismissButton
            .click({ force: true })
            .catch(() => undefined);
    }

    try {
        await Promise.all([
            expect(modal).toBeHidden({ timeout: 5_000 }),
            expect(page.locator(".modal-backdrop")).toHaveCount(0, {
                timeout: 5_000,
            }),
        ]);

        return;
    } catch {
    }

    if (await modal.count()) {
        await modal.evaluate(element => {
            const modalElement = element as HTMLElement;

            modalElement.classList.remove("show");
            modalElement.style.display = "none";
            modalElement.setAttribute("aria-hidden", "true");
            modalElement.removeAttribute("aria-modal");
        });
    }

    await page.locator(".modal-backdrop").evaluateAll(elements => {
        elements.forEach(element => element.remove());
    });

    await page.evaluate(() => {
        document.body.classList.remove("modal-open");
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("padding-right");
    });

    await expect(modal).toBeHidden();
};

const closeStudentModalAfterSave = async (
    page: Page,
    studentModal: Locator,
) => {
    try {
        await expect(studentModal).toBeHidden({ timeout: 1_000 });

        return;
    } catch {
    }

    const closeButton = studentModal
        .locator('button[aria-label="Close"]')
        .first();

    if (await closeButton.count()) {
        await closeButton
            .click({ force: true })
            .catch(() => undefined);
    }

    await waitForModalToClose(page, studentModal);
};

test.setTimeout(180_000);

test.use({
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
});

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

    const responsePromise = waitForApiResponse(
        page,
        "POST",
        path => path.endsWith("/login"),
    );

    await page.getByRole("button", { name: "Войти" }).click();

    await expectSuccessfulResponse(
        await responsePromise,
        `Login for "${ADMIN_USERNAME}"`,
    );

    await expect(page).toHaveURL(`${BASENAME}/meetings`, {
        timeout: 20_000,
    });
};

const getMemberCard = (page: Page, memberName: string) =>
    page.locator(".card").filter({
        has: page.getByRole("heading", {
            name: memberName,
            exact: true,
        }),
    });

const getMeetingCard = (page: Page, meetingInfo: string) =>
    page.locator(".card").filter({
        has: page.getByRole("heading", {
            name: meetingInfo,
            exact: true,
        }),
    });

const getCriteria = (page: Page, criteriaName: string) =>
    page.locator(".accordion-item").filter({
        has: page.locator('p[id="criteria"]').filter({
            hasText: criteriaName,
        }),
    });

const performMemberSearch = async (
    page: Page,
    memberName: string,
) => {
    const searchInput = page.locator("#search-input");
    const responsePromise = waitForMemberSearch(page, memberName);

    await searchInput.fill("");
    await searchInput.fill(memberName);

    await expectSuccessfulResponse(
        await responsePromise,
        `Member search for "${memberName}"`,
    );

    return searchInput;
};

const selectMemberFromDropdown = async (
    page: Page,
    memberName: string,
) => {
    const searchInput = await performMemberSearch(page, memberName);
    const memberOption = page.locator(".dropdown-item").filter({
        has: page.getByText(memberName, {
            exact: true,
        }),
    });

    await expect.poll(async () => {
        await searchInput.blur();
        await searchInput.focus();

        return memberOption.count();
    }, {
        intervals: [100, 250, 500, 1_000],
        timeout: 20_000,
        message: `Member option "${memberName}" did not appear.`,
    }).toBe(1);

    await memberOption.click({ timeout: 20_000 });
};

const findMemberCard = async (page: Page, memberName: string) => {
    await performMemberSearch(page, memberName);

    const memberCard = getMemberCard(page, memberName);

    await expect(memberCard).toHaveCount(1, { timeout: 20_000 });

    return memberCard;
};

const createTestMember = async (page: Page, info: MemberInfo) => {
    await page.goto(`${BASENAME}/members`);

    await performMemberSearch(page, info.name);

    await page.locator("#add-member-button").click();

    const modal = page.locator(".modal.show");

    await expect(modal).toBeVisible();

    await modal.locator('input[name="name"]').fill(info.name);

    await modal.locator("input[name=email]").fill(info.email);

    await modal.locator("input[name=phone]").fill(info.phone);

    await modal
        .locator("textarea[name=information-ru]")
        .fill(info.informationRu);

    await modal
        .locator("textarea[name=information-en]")
        .fill(info.informationEn);

    const createResponsePromise = waitForApiResponse(
        page,
        "POST",
        path => path.endsWith("/members"),
    );

    const refreshedSearchPromise = waitForMemberSearch(page, info.name);

    await modal.locator("#form-submit-button").click();

    const [createResponse, refreshedSearchResponse] = await Promise.all([
        createResponsePromise,
        refreshedSearchPromise,
    ]);

    await expectSuccessfulResponse(
        createResponse,
        `Creating member "${info.name}"`,
    );

    await expectSuccessfulResponse(
        refreshedSearchResponse,
        `Refreshing member "${info.name}"`,
    );

    await waitForModalToClose(page, modal);
    await expect(getMemberCard(page, info.name)).toHaveCount(1, {
        timeout: 20_000,
    });
};

const deleteMemberIfExists = async (page: Page, memberName: string) => {
    if (page.isClosed()) {
        return;
    }

    if (!await navigateForCleanup(
        page,
        `${BASENAME}/members`,
    )) {
        return;
    }

    await performMemberSearch(page, memberName);

    const memberCard = getMemberCard(page, memberName);

    if (!await waitForElementIfExists(memberCard)) {
        return;
    }

    await expect(memberCard).toHaveCount(1);
    await memberCard.click();

    const modal = page.locator(".modal.show");

    const deleteResponsePromise = waitForApiResponse(
        page,
        "DELETE",
        path => path.endsWith("/members"),
    );

    const refreshedSearchPromise = waitForMemberSearch(page, memberName);

    await performWithAcceptedConfirm(
        page,
        () => modal
            .locator("#delete-member-button")
            .click(),
    );

    const [deleteResponse, refreshedSearchResponse] = await Promise.all([
        deleteResponsePromise,
        refreshedSearchPromise,
    ]);

    await expectSuccessfulResponse(
        deleteResponse,
        `Deleting member "${memberName}"`,
    );

    await expectSuccessfulResponse(
        refreshedSearchResponse,
        `Refreshing deleted member "${memberName}"`,
    );

    await waitForModalToClose(page, modal);
    await expect(memberCard).toHaveCount(0, { timeout: 20_000 });
};

const createCriteria = async (
    page: Page,
    name: string,
    comment: string,
) => {
    await page.goto(`${BASENAME}/criteria`);

    const modal = page.locator("#criteriaModal");

    await waitForBootstrapModalToOpen(
        modal,
        () => page.locator("#add-criteria").click(),
    );

    await modal.locator('input[name="name"]').fill(name);
    await modal.locator('textarea[name="comment"]').fill(comment);

    const responsePromise = waitForApiResponse(
        page,
        "POST",
        path => path.endsWith("/criteria/new"),
    );

    await modal.locator("#save-criteria").click();

    const response = await responsePromise;

    await expectSuccessfulResponse(
        response,
        `Creating criterion "${name}"`,
    );

    await expect(modal).toBeHidden();

    await page.getByRole("tab", {
        name: "Все критерии",
        exact: true,
    }).click();

    await expect(getCriteria(page, name)).toHaveCount(1);
};

const deleteCriteriaIfExists = async (
    page: Page,
    criteriaName: string,
) => {
    if (page.isClosed()) {
        return;
    }

    if (!await navigateForCleanup(
        page,
        `${BASENAME}/criteria`,
    )) {
        return;
    }

    await page
        .getByRole('tab', {
            name: 'Все критерии',
            exact: true,
        })
        .click();

    const criteriaCard =
        getCriteria(page, criteriaName);

    if (!await waitForElementIfExists(criteriaCard)) {
        return;
    }

    await expect(criteriaCard).toBeVisible();

    const deleteResponsePromise = waitForApiResponse(
        page,
        "DELETE",
        path => path.endsWith("/criteria/delete"),
    );

    await performWithAcceptedConfirm(
        page,
        () => criteriaCard
            .locator("#delete-criteria")
            .click(),
    );

    await expectSuccessfulResponse(
        await deleteResponsePromise,
        `Deleting criterion "${criteriaName}"`,
    );

    await expect(criteriaCard).toHaveCount(0, { timeout: 20_000 });
};

const createMeeting = async (
    page: Page,
    meetingInfo: string,
    memberName: string,
    _criteriaName: string,
) => {
    const initialMembersResponsePromise =
        waitForMemberSearch(page, "");

    await page.goto(`${BASENAME}/meetings/new`);

    const initialMembersResponse =
        await initialMembersResponsePromise;

    await expectSuccessfulResponse(
        initialMembersResponse,
        "Loading members on the meeting form",
    );

    await page.locator('input[name="auditorium"]').fill("3389");

    await page.locator('input[name="info"]:visible').fill(meetingInfo);

    const studentModal = page.locator("#studentWorkModal");

    await waitForBootstrapModalToOpen(
        studentModal,
        () => page.locator("#add-student").click(),
    );

    await studentModal
        .locator('input[name="studentName"]')
        .fill("E2E student");

    await studentModal
        .locator('input[name="theme"]')
        .fill("E2E theme");

    await studentModal
        .locator('input[name="supervisor"]')
        .fill("E2E supervisor");

    await studentModal.locator("#save-student").click();

    const studentRow = page
        .getByRole("row")
        .filter({ hasText: "E2E student" });

    await expect(studentRow).toHaveCount(1, { timeout: 10_000 });

    await closeStudentModalAfterSave(page, studentModal);

    await selectMemberFromDropdown(page, memberName);

    const criteriaGroupInput =
        page.locator('input[name^="criteria-"]').first();

    await expect(criteriaGroupInput).toBeVisible();

    if (!(await criteriaGroupInput.isChecked())) {
        await criteriaGroupInput.locator("+ label").click();
    }

    await expect(criteriaGroupInput).toBeChecked();

    const saveResponsePromise = waitForApiResponse(
    page,
    "POST",
    path => path.endsWith("/meetings/new"),
);

    await page.locator("#save-meeting").click();

    const saveResponse = await saveResponsePromise;

    await expectSuccessfulResponse(
        saveResponse,
        `Creating meeting "${meetingInfo}"`,
    );

    await page.waitForURL(
        url => url.pathname === `${BASENAME}/meetings`,
        {
            timeout: 20_000,
        },
    );

    await expect(
        getMeetingCard(page, meetingInfo),
    ).toHaveCount(1);
};

const deleteMeetingIfExists = async (page: Page, meetingInfo: string) => {
    if (page.isClosed()) {
        return;
    }

    if (!await navigateForCleanup(
        page,
        `${BASENAME}/meetings`,
    )) {
        return;
    }

    const meetingCard = getMeetingCard(page, meetingInfo);

    if (!await waitForElementIfExists(meetingCard)) {
        return;
    }

    await expect(meetingCard).toHaveCount(1);

    const deleteResponsePromise = waitForApiResponse(
        page,
        "DELETE",
        path => path.endsWith("/meetings/delete"),
    );

    await performWithAcceptedConfirm(
        page,
        () => meetingCard
            .locator("#delete-meeting")
            .click(),
    );

    await expectSuccessfulResponse(
        await deleteResponsePromise,
        `Deleting meeting "${meetingInfo}"`,
    );

    await expect(meetingCard).toHaveCount(0, { timeout: 20_000 });
};

test("admin login", async ({ page }) => {
    await login(page);
});

test("admin logout", async ({ page }) => {
    await login(page);

    await page.locator("#profile-link").click();

    await expect(page).toHaveURL(`${BASENAME}/profile`, {
        timeout: 20_000,
    });

    await page.locator("#exit").click();

    await expect(page).toHaveURL(`${BASENAME}/login`, {
        timeout: 20_000,
    });

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
    
    try {
        await login(page);

        await createTestMember(page, memberInfo);

        await createCriteria(
            page,
            criteriaName,
            `E2E comment ${suffix}`,
        );

        await createMeeting(
            page,
            meetingInfo,
            memberInfo.name,
            criteriaName,
        );

        const meetingCard = getMeetingCard(page, meetingInfo);

        await expect(meetingCard).toHaveCount(1);
} finally {
    await bestEffortCleanup(
        `deleting meeting "${meetingInfo}"`,
        () => deleteMeetingIfExists(page, meetingInfo),
    );

    await bestEffortCleanup(
        `deleting criterion "${criteriaName}"`,
        () => deleteCriteriaIfExists(page, criteriaName),
    );

    await bestEffortCleanup(
        `deleting member "${memberInfo.name}"`,
        () => deleteMemberIfExists(page, memberInfo.name),
    );
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

        const modal = page.locator(".modal.show");

        await expect(modal).toBeVisible();

        await expect(modal.locator("input[name=name]")).toHaveValue(
            memberInfo.name,
        );

        await expect(modal.locator("input[name=email]")).toHaveValue(
            memberInfo.email,
        );

        await expect(modal.locator("input[name=phone]")).toHaveValue(
            memberInfo.phone,
        );

        await expect(modal.locator("textarea[name=information-ru]")).toHaveValue(
            memberInfo.informationRu,
        );

        await expect(modal.locator("textarea[name=information-en]")).toHaveValue(
            memberInfo.informationEn,
        );

        const deleteResponsePromise = waitForApiResponse(
            page,
            "DELETE",
            path => path.endsWith("/members"),
        );

        const refreshedSearchPromise = waitForMemberSearch(
            page,
            memberInfo.name,
        );

        await performWithAcceptedConfirm(
            page,
            () => modal
                .locator("#delete-member-button")
                .click(),
        );

        const [deleteResponse, refreshedSearchResponse] = await Promise.all([
            deleteResponsePromise,
            refreshedSearchPromise,
        ]);

        await expectSuccessfulResponse(
            deleteResponse,
            `Deleting member "${memberInfo.name}"`,
        );

        await expectSuccessfulResponse(
            refreshedSearchResponse,
            `Refreshing deleted member "${memberInfo.name}"`,
        );

        await waitForModalToClose(page, modal);
        await performMemberSearch(page, memberInfo.name);

        await expect(getMemberCard(page, memberInfo.name)).toHaveCount(0, {
            timeout: 20_000,
        });
    } finally {
        await bestEffortCleanup(
            `deleting member "${memberInfo.name}"`,
            () => deleteMemberIfExists(page, memberInfo.name),
        );
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

        const editModal = page.locator(".modal.show");

        await expect(editModal).toBeVisible();

        await editModal.locator("input[name=name]").fill(editedInfo.name);

        await editModal.locator("input[name=email]").fill(editedInfo.email);

        await editModal.locator("input[name=phone]").fill(editedInfo.phone);

        await editModal
            .locator("textarea[name=information-ru]")
            .fill(editedInfo.informationRu);

        await editModal
            .locator("textarea[name=information-en]")
            .fill(editedInfo.informationEn);

        const updateResponsePromise = waitForApiResponse(
            page,
            "PUT",
            path => path.endsWith("/members"),
        );

        const refreshedSearchPromise = waitForMemberSearch(
            page,
            originalInfo.name,
        );

        await editModal.locator("#form-submit-button").click();

        const [updateResponse, refreshedSearchResponse] = await Promise.all([
            updateResponsePromise,
            refreshedSearchPromise,
        ]);

        await expectSuccessfulResponse(
            updateResponse,
            `Updating member "${originalInfo.name}"`,
        );

        await expectSuccessfulResponse(
            refreshedSearchResponse,
            `Refreshing updated member "${originalInfo.name}"`,
        );

        await waitForModalToClose(page, editModal);

        const editedCard = await findMemberCard(page, editedInfo.name);

        await editedCard.click();

        const verifyModal = page.locator(".modal.show");

        await expect(verifyModal).toBeVisible();

        await expect(verifyModal.locator("input[name=name]")).toHaveValue(
            editedInfo.name,
        );

        await expect(verifyModal.locator("input[name=email]")).toHaveValue(
            editedInfo.email,
        );

        await expect(verifyModal.locator("input[name=phone]")).toHaveValue(
            editedInfo.phone,
        );

        await expect(
            verifyModal.locator("textarea[name=information-ru]"),
        ).toHaveValue(editedInfo.informationRu);

        await expect(
            verifyModal.locator("textarea[name=information-en]"),
        ).toHaveValue(editedInfo.informationEn);

        await verifyModal
            .getByRole("button", { name: "Close" })
            .click();

        await waitForModalToClose(page, verifyModal);
    } finally {
        await bestEffortCleanup(
            `deleting member "${editedInfo.name}"`,
            () => deleteMemberIfExists(page, editedInfo.name),
        );

        await bestEffortCleanup(
            `deleting member "${originalInfo.name}"`,
            () => deleteMemberIfExists(page, originalInfo.name),
        );
    }
});
