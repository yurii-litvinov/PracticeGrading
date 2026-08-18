/// <reference types="node" />

import {
    expect as playwrightExpect,
    test,
    type BrowserContext,
    type Dialog,
    type Locator,
    type Page,
    type Response,
} from '@playwright/test';

const expect = playwrightExpect.configure({
    timeout: 20_000,
});

const ADMIN_USERNAME =
    process.env.E2E_ADMIN_USERNAME ?? 'admin';

const ADMIN_PASSWORD =
    process.env.E2E_ADMIN_PASSWORD ?? 'admin';

const BASENAME = '/practice-grading';

const waitForMemberSearch = (
    page: Page,
    searchName: string,
) =>
    page.waitForResponse(response => {
        const url = new URL(response.url());

        return response.request().method() === 'GET' &&
            url.pathname.endsWith('/members') &&
            url.searchParams.get('searchName') ===
                searchName;
    }, { timeout: 20_000 });

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

const expectSuccessfulResponse = async (
    response: Response,
    operation: string,
) => {
    if (response.ok()) {
        return;
    }

    const responseBody = await response
        .text()
        .catch(() => '<response body unavailable>');

    expect(
        response.ok(),
        `${operation} returned ${response.status()}: ` +
        responseBody,
    ).toBeTruthy();
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

const waitForElementIfExists = async (
    locator: Locator,
    timeout = 5_000,
) => {
    try {
        await locator.waitFor({
            state: 'attached',
            timeout,
        });

        return true;
    } catch {
        return false;
    }
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

                        expect(dialogType).toBe('confirm');
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                })();
            };

            page.once('dialog', handleDialog);

            timeoutId = setTimeout(
                () => reject(new Error(
                    'The confirmation dialog did not appear.',
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
            page.off('dialog', handleDialog);
        }
    }
};

const TRUSTED_ACCESS_TOKEN_KEY =
    'trusted-member-access-token';

const MEETING_ACCESS_TOKEN_KEY_PREFIX =
    'meeting-member-access-token';

test.setTimeout(180_000);

test.use({
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
});

type MemberInfo = {
    name: string;
    email: string;
};

const createUniqueSuffix = () =>
    `${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;

const bestEffortCleanup = async (
    operation: string,
    cleanup: () => Promise<void>,
) => {
    try {
        await cleanup();
    } catch (error) {
        // A failed assertion can make Playwright close the page before the
        // finally block finishes. Cleanup must never hide the original error.
        console.warn(
            `Cleanup failed (${operation}): ${String(error)}`,
        );
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
            waitUntil: 'domcontentloaded',
        });

        return true;
    } catch (error) {
        const message = String(error);

        if (
            page.isClosed() ||
            message.includes('has been closed') ||
            message.includes('Target page') ||
            message.includes('Test ended')
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
            expect(
                page.locator('.modal-backdrop'),
            ).toHaveCount(0, { timeout: 5_000 }),
        ]);

        return;
    } catch {
        // Bootstrap transitions can occasionally remain unfinished in
        // Firefox/WebKit. First retry the same user-facing dismiss action.
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
            expect(
                page.locator('.modal-backdrop'),
            ).toHaveCount(0, { timeout: 5_000 }),
        ]);

        return;
    } catch {
        // The operation behind the modal has already completed. Remove only
        // the stale Bootstrap presentation state so it cannot block the next
        // real UI action.
    }

    if (await modal.count()) {
        await modal.evaluate(element => {
            const modalElement = element as HTMLElement;

            modalElement.classList.remove('show');
            modalElement.style.display = 'none';
            modalElement.setAttribute('aria-hidden', 'true');
            modalElement.removeAttribute('aria-modal');
        });
    }

    await page.locator('.modal-backdrop').evaluateAll(elements => {
        elements.forEach(element => element.remove());
    });

    await page.evaluate(() => {
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('padding-right');
    });

    await expect(modal).toBeHidden();
};

const closeStudentModalAfterSave = async (
    page: Page,
    studentModal: Locator,
) => {
    try {
        // Normally StudentWorkModal clicks its own dismiss button after it
        // adds the work. Do not spend the full generic modal timeout waiting
        // for that synthetic click: WebKit can occasionally miss it.
        await expect(studentModal).toBeHidden({ timeout: 1_000 });

        return;
    } catch {
        // The row has already been added, so saving succeeded. Some WebKit
        // runs miss Bootstrap's synthetic dismiss click; use the real close
        // control once, only after the normal transition had time to finish.
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

const performMemberSearch = async (
    page: Page,
    memberName: string,
) => {
    const searchInput = page.locator('#search-input');
    const responsePromise = waitForMemberSearch(
        page,
        memberName,
    );

    await searchInput.fill('');
    await searchInput.fill(memberName);

    const response = await responsePromise;
    await expectSuccessfulResponse(
        response,
        `Member search for "${memberName}"`,
    );

    return searchInput;
};

const selectMemberFromDropdown = async (
    page: Page,
    memberName: string,
) => {
    const searchInput = await performMemberSearch(
        page,
        memberName,
    );

    const memberOption = page
        .locator('.dropdown-item')
        .filter({
            has: page.getByText(memberName, {
                exact: true,
            }),
        });

    // The dropdown opens on focus only when the search results have reached
    // React state. The HTTP response may finish one render earlier, so reopen
    // it until the exact option is present.
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

const login = async (
    page: Page,
    userName = ADMIN_USERNAME,
    password = ADMIN_PASSWORD,
) => {
    await page.goto(`${BASENAME}/login`);

    await page.locator('#username').fill(userName);
    await page.locator('#password').fill(password);

    const loginResponsePromise = waitForApiResponse(
        page,
        'POST',
        path => path.endsWith('/login'),
    );

    await page
        .getByRole('button', { name: 'Войти' })
        .click();

    const loginResponse = await loginResponsePromise;
    await expectSuccessfulResponse(
        loginResponse,
        `Login for "${userName}"`,
    );

    await expect(page).toHaveURL(
        `${BASENAME}/meetings`,
        { timeout: 20_000 },
    );
};

const getMemberCard = (
    page: Page,
    memberName: string,
) =>
    page.locator('.card').filter({
        has: page.getByRole('heading', {
            name: memberName,
            exact: true,
        }),
    });

const getMeetingCard = (
    page: Page,
    meetingInfo: string,
) =>
    page.locator('.card').filter({
        has: page.getByRole('heading', {
            name: meetingInfo,
            exact: true,
        }),
    });

const openMembersPage = async (page: Page) => {
    await page.locator('#members-link').click();

    await expect(page).toHaveURL(
        `${BASENAME}/members`,
        { timeout: 20_000 },
    );
};

const openMeetingsPage = async (page: Page) => {
    await page.locator('#meetings-link').click();

    await expect(page).toHaveURL(
        `${BASENAME}/meetings`,
        { timeout: 20_000 },
    );
};

const findMemberCard = async (
    page: Page,
    memberName: string,
) => {
    await performMemberSearch(page, memberName);

    const memberCard =
        getMemberCard(page, memberName);

    await expect(memberCard).toHaveCount(1, {
        timeout: 20_000,
    });

    return memberCard;
};

const createMember = async (
    page: Page,
    member: MemberInfo,
) => {
    await openMembersPage(page);

    await performMemberSearch(page, member.name);

    await page
        .locator('#add-member-button')
        .click();

    const modal = page.locator('.modal.show');

    await expect(modal).toBeVisible();

    await modal
        .locator('input[name="name"]')
        .fill(member.name);

    await modal
        .locator('input[name="email"]')
        .fill(member.email);

    const createResponsePromise = waitForApiResponse(
        page,
        'POST',
        path => path.endsWith('/members'),
    );

    const refreshedSearchPromise = waitForMemberSearch(
        page,
        member.name,
    );

    await modal
        .locator('#form-submit-button')
        .click();

    const [createResponse, refreshedSearchResponse] =
        await Promise.all([
            createResponsePromise,
            refreshedSearchPromise,
        ]);

    await expectSuccessfulResponse(
        createResponse,
        `Creating member "${member.name}"`,
    );

    await expectSuccessfulResponse(
        refreshedSearchResponse,
        `Refreshing member "${member.name}"`,
    );

    await waitForModalToClose(page, modal);
    await expect(
        getMemberCard(page, member.name),
    ).toHaveCount(1, { timeout: 20_000 });
};

const deleteMemberIfExists = async (
    page: Page,
    memberName: string,
) => {
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

    const memberCard =
        getMemberCard(page, memberName);

    if (!await waitForElementIfExists(memberCard)) {
        return;
    }

    await expect(memberCard).toHaveCount(1);
    await memberCard.click();

    const modal = page.locator('.modal.show');

    const deleteResponsePromise = waitForApiResponse(
        page,
        'DELETE',
        path => path.endsWith('/members'),
    );

    const refreshedSearchPromise = waitForMemberSearch(
        page,
        memberName,
    );

    await performWithAcceptedConfirm(
        page,
        () => modal
            .locator('#delete-member-button')
            .click(),
    );

    const [deleteResponse, refreshedSearchResponse] =
        await Promise.all([
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
    await expect(memberCard).toHaveCount(0);
};

const createMeeting = async (
    page: Page,
    meetingInfo: string,
    initialMemberName: string,
) => {
    await openMeetingsPage(page);

    const initialMembersResponsePromise =
        waitForMemberSearch(page, '');

    await page
        .locator('#create-meeting')
        .click();

    await expect(page).toHaveURL(
        `${BASENAME}/meetings/new`,
        { timeout: 20_000 },
    );

    const initialMembersResponse =
        await initialMembersResponsePromise;

    await expectSuccessfulResponse(
        initialMembersResponse,
        'Loading members on the meeting form',
    );

    await page
        .locator('input[name="auditorium"]')
        .fill('3389');

    await page
        .locator('input[name="info"]:visible')
        .fill(meetingInfo);

    const studentModal = page.locator('#studentWorkModal');

    await waitForBootstrapModalToOpen(
        studentModal,
        () => page.locator('#add-student').click(),
    );

    await studentModal
        .locator('input[name="studentName"]')
        .fill('E2E student');

    await studentModal
        .locator('input[name="theme"]')
        .fill('E2E theme');

    await studentModal
        .locator('input[name="supervisor"]')
        .fill('E2E supervisor');

    await studentModal
        .locator('#save-student')
        .click();

    const addedStudentRow = page
        .getByRole('row')
        .filter({ hasText: 'E2E student' });

    await expect(addedStudentRow).toHaveCount(1);

    await closeStudentModalAfterSave(page, studentModal);

    await selectMemberFromDropdown(
        page,
        initialMemberName,
    );

    const criteriaGroup = page
        .locator('input[name^="criteria-"] + label')
        .filter({
            hasText: 'Критерии для учебных практик',
        });

    await expect(criteriaGroup).toHaveCount(1);
    await criteriaGroup.click();

    const saveMeetingResponsePromise = waitForApiResponse(
        page,
        'POST',
        path => path.endsWith('/meetings/new'),
    );

    await page.locator('#save-meeting').click();

    const saveMeetingResponse =
        await saveMeetingResponsePromise;

    await expectSuccessfulResponse(
        saveMeetingResponse,
        `Creating meeting "${meetingInfo}"`,
    );

    await expect(page).toHaveURL(
        `${BASENAME}/meetings`,
        { timeout: 20_000 },
    );

    await expect(
        getMeetingCard(page, meetingInfo),
    ).toHaveCount(1, { timeout: 20_000 });
};

const openMeetingAndGetSharedLink = async (
    page: Page,
    meetingInfo: string,
) => {
    await openMeetingsPage(page);

    const meetingCard =
        getMeetingCard(page, meetingInfo);

    await expect(meetingCard).toHaveCount(1);

    await meetingCard
        .locator('#view_meeting')
        .click();

    await expect(page).toHaveURL(
        new RegExp(
            `${BASENAME}/meetings/\\d+$`,
        ),
        { timeout: 20_000 },
    );

    const sharedLink =
        (await page.locator('#copy').innerText())
            .trim();

    const meetingIdMatch = new URL(
        sharedLink,
        page.url(),
    )
        .pathname
        .match(/\/meetings\/(\d+)\/member$/);

    if (!meetingIdMatch) {
        throw new Error(
            `Cannot extract meeting ID from ${sharedLink}`,
        );
    }

    return {
        meetingId: Number(meetingIdMatch[1]),
        sharedLink,
    };
};

const deleteMeetingIfExists = async (
    page: Page,
    meetingInfo: string,
) => {
    if (page.isClosed()) {
        return;
    }

    if (!await navigateForCleanup(
        page,
        `${BASENAME}/meetings`,
    )) {
        return;
    }

    await expect(page).toHaveURL(
        `${BASENAME}/meetings`,
    );
    
    const meetingCard =
        getMeetingCard(page, meetingInfo);

    if (!await waitForElementIfExists(meetingCard)) {
        return;
    }

    await expect(meetingCard).toHaveCount(1);

    const deleteResponsePromise = waitForApiResponse(
        page,
        'DELETE',
        path => path.endsWith('/meetings/delete'),
    );

    await performWithAcceptedConfirm(
        page,
        () => meetingCard
            .locator('#delete-meeting')
            .click(),
    );

    const deleteResponse = await deleteResponsePromise;
    await expectSuccessfulResponse(
        deleteResponse,
        `Deleting meeting "${meetingInfo}"`,
    );

    await expect(meetingCard).toHaveCount(0);
};

const getAccessPanel = (
    page: Page,
    heading: string,
) =>
    page.locator('.card').filter({
        has: page.getByRole('heading', {
            name: heading,
            exact: true,
        }),
    });

const getAccessRow = (
    page: Page,
    panelHeading: string,
    memberName: string,
) =>
    getAccessPanel(page, panelHeading)
        .locator('.border.rounded.p-3')
        .filter({
            has: page.getByText(memberName, {
                exact: true,
            }),
        });

const issueTrustedAccessLink = async (
    page: Page,
    memberName: string,
) => {
    await openMembersPage(page);

    const memberCard = await findMemberCard(
        page,
        memberName,
    );

    await memberCard.click();

    const modal = page.locator('.modal.show');

    await expect(
        modal.getByText(
            'Доверенный доступ',
            { exact: true },
        ),
    ).toBeVisible();

    const issueResponsePromise = waitForApiResponse(
        page,
        'POST',
        path =>
            path.endsWith('/trusted-access') &&
            path.includes('/members/'),
    );

    await modal
        .getByRole('button', {
            name: 'Выдать ссылку',
            exact: true,
        })
        .click();

    const issueResponse = await issueResponsePromise;
    await expectSuccessfulResponse(
        issueResponse,
        `Issuing trusted access for "${memberName}"`,
    );

    const linkInput = modal
        .locator('.alert-warning')
        .locator('input[readonly]');

    await expect(linkInput).toBeVisible();

    const activationLink =
        await linkInput.inputValue();

    expect(activationLink).toContain(
        `${BASENAME}/trusted-access#token=`,
    );

    await modal
        .locator('button[aria-label="Close"]')
        .click();

    await waitForModalToClose(page, modal);

    const updatedMemberCard =
        await findMemberCard(
            page,
            memberName,
        );

    await expect(
        updatedMemberCard.locator(
            '[aria-label="Доверенный доступ активен"]',
        ),
    ).toBeVisible();

    return activationLink;
};

const revokeTrustedAccess = async (
    page: Page,
    memberName: string,
) => {
    await openMembersPage(page);

    const memberCard = await findMemberCard(
        page,
        memberName,
    );

    await memberCard.click();

    const modal = page.locator('.modal.show');

    const revokeButton = modal.getByRole(
        'button',
        {
            name: 'Отозвать',
            exact: true,
        },
    );

    await expect(revokeButton).toBeVisible();

    const revokeResponsePromise = waitForApiResponse(
        page,
        'DELETE',
        path =>
            path.endsWith('/trusted-access') &&
            path.includes('/members/'),
    );

    await performWithAcceptedConfirm(
        page,
        () => revokeButton.click(),
    );

    const revokeResponse = await revokeResponsePromise;
    await expectSuccessfulResponse(
        revokeResponse,
        `Revoking trusted access for "${memberName}"`,
    );

    await expect(
        modal.getByText('Отозван', {
            exact: true,
        }),
    ).toBeVisible();

    await modal
        .locator('button[aria-label="Close"]')
        .click();

    await waitForModalToClose(page, modal);

    const updatedMemberCard =
        await findMemberCard(
            page,
            memberName,
        );

    await expect(
        updatedMemberCard.locator(
            '[aria-label="Доверенный доступ активен"]',
        ),
    ).toHaveCount(0);
};

const closeContext = async (
    context: BrowserContext | undefined,
) => {
    if (!context) {
        return;
    }

    await context.close().catch(error => {
        const message = String(error);

        if (
            message.includes('has been closed') ||
            message.includes('Target page') ||
            message.includes('Test ended')
        ) {
            return;
        }

        throw error;
    });
};

const returnToMemberMeeting = async (
    page: Page,
    meetingId: number,
) => {
    const memberMeetingUrl = new RegExp(
        `${BASENAME}/meetings/${meetingId}/member$`,
    );

    // StudentWorkPage uses window.history.back(). Reloads performed while
    // checking persistence can leave several identical student-work entries
    // in browser history. Click the actual UI button until those entries are
    // consumed instead of assuming one click is always enough.
    for (let attempt = 0; attempt < 4; attempt += 1) {
        if (memberMeetingUrl.test(page.url())) {
            return;
        }

        await page
            .getByRole('button', {
                name: 'Назад к заседанию',
                exact: true,
            })
            .click();

        const navigationCompleted = await expect
            .poll(
                () => memberMeetingUrl.test(page.url()),
                {
                    timeout: 2_000,
                    intervals: [100, 250, 500],
                },
            )
            .toBe(true)
            .then(() => true)
            .catch(() => false);

        if (navigationCompleted) {
            return;
        }
    }

    // The UI action has been exercised above. If browser history still does
    // not contain the meeting page (which differs between browser engines),
    // use the canonical route so this test does not depend on history shape.
    const canonicalMeetingUrl = new URL(
        `${BASENAME}/meetings/${meetingId}/member`,
        page.url(),
    ).toString();

    await page.goto(canonicalMeetingUrl, {
        waitUntil: 'domcontentloaded',
    });

    await expect(page).toHaveURL(memberMeetingUrl, {
        timeout: 15_000,
    });
};

test(
    'ordinary access can be approved, grade a work, and be revoked',
    async ({ page, browser }) => {
        const suffix = createUniqueSuffix();

        const hostMember: MemberInfo = {
            name: `E2E host ${suffix}`,
            email: `host-${suffix}@example.com`,
        };

        const requestedMemberName =
            `E2E unlisted member ${suffix}`;

        const meetingInfo =
            `E2E ordinary access ${suffix}`;

        let memberContext:
            BrowserContext | undefined;

        await login(page);

        try {
            await test.step(
                'create a meeting without the requesting member',
                async () => {
                    await createMember(
                        page,
                        hostMember,
                    );

                    await createMeeting(
                        page,
                        meetingInfo,
                        hostMember.name,
                    );
                },
            );

            const {
                meetingId,
                sharedLink,
            } = await test.step(
                'open the meeting through admin UI',
                () =>
                    openMeetingAndGetSharedLink(
                        page,
                        meetingInfo,
                    ),
            );

            memberContext =
                await browser.newContext();

            const memberPage =
                await memberContext.newPage();

            memberPage.setDefaultTimeout(20_000);
            memberPage.setDefaultNavigationTimeout(30_000);

            await test.step(
                'submit a request under a new name',
                async () => {
                    await memberPage.goto(
                        sharedLink,
                    );

                    await expect(memberPage)
                        .toHaveURL(
                            new RegExp(
                                `${BASENAME}/meetings/` +
                                `${meetingId}/member/login$`,
                            ),
                        );

                    await expect.poll(
                        () =>
                            memberPage
                                .locator('select option')
                                .count(),
                    ).toBeGreaterThan(1);

                    await memberPage
                        .getByPlaceholder(
                            'Введите ФИО',
                        )
                        .fill(requestedMemberName);

                    await expect(
                        memberPage.locator('select'),
                    ).toHaveValue('0');

                    const accessRequestResponsePromise =
                        waitForApiResponse(
                            memberPage,
                            'POST',
                            path => path.endsWith(
                                `/meetings/${meetingId}` +
                                '/access-requests',
                            ),
                        );

                    await memberPage
                        .getByRole('button', {
                            name: 'Отправить запрос',
                        })
                        .click();

                    const accessRequestResponse =
                        await accessRequestResponsePromise;

                    await expectSuccessfulResponse(
                        accessRequestResponse,
                        'Submitting an ordinary access request',
                    );

                    await expect(
                        memberPage.getByRole(
                            'heading',
                            {
                                name: 'Запрос отправлен',
                            },
                        ),
                    ).toBeVisible();

                    await expect(
                        memberPage.getByRole(
                            'heading',
                            {
                                name: 'Просмотр заседания',
                            },
                        ),
                    ).toBeVisible();
                },
            );

            await test.step(
                'approve the request as administrator',
                async () => {
                    const pendingRow =
                        getAccessRow(
                            page,
                            'Запросы на участие',
                            requestedMemberName,
                        );

                    await expect(pendingRow)
                        .toBeVisible({
                            timeout: 15_000,
                        });

                    const approvalResponsePromise =
                        waitForApiResponse(
                            page,
                            'POST',
                            path =>
                                path.includes(
                                    `/meetings/${meetingId}/` +
                                    'access-requests/',
                                ) &&
                                path.endsWith('/approve'),
                        );

                    await pendingRow
                        .getByRole('button', {
                            name: 'Подтвердить',
                        })
                        .click();

                    const approvalResponse =
                        await approvalResponsePromise;

                    await expectSuccessfulResponse(
                        approvalResponse,
                        'Approving the ordinary access request',
                    );

                    await expect(pendingRow)
                        .toHaveCount(0);
                },
            );

            await test.step(
                'enter the meeting after approval',
                async () => {
                    await expect(memberPage)
                        .toHaveURL(
                            new RegExp(
                                `${BASENAME}/meetings/` +
                                `${meetingId}/member$`,
                            ),
                            {
                                timeout: 15_000,
                            },
                        );

                    await expect(
                        memberPage.getByRole(
                            'heading',
                            {
                                name: 'Список защищающихся студентов',
                            },
                        ),
                    ).toBeVisible();
                },
            );

            await test.step(
                'grade a student work and restore the mark after reload',
                async () => {
                    const studentRow = memberPage
                        .getByRole('row')
                        .filter({
                            has: memberPage.getByRole(
                                'cell',
                                {
                                    name: 'E2E student',
                                    exact: true,
                                },
                            ),
                        });

                    await expect(studentRow)
                        .toHaveCount(1);

                    await studentRow.click();

                    await expect(memberPage)
                        .toHaveURL(
                            new RegExp(
                                `${BASENAME}/meetings/` +
                                `${meetingId}/studentwork/\\d+$`,
                            ),
                        );

                    const myMarkCard = memberPage
                        .locator('.card')
                        .filter({
                            has: memberPage.getByRole(
                                'heading',
                                {
                                    name: 'Моя оценка',
                                    exact: true,
                                },
                            ),
                        });

                    await expect(myMarkCard)
                        .toBeVisible();

                    const firstScaleRule = myMarkCard
                        .locator('input[type="radio"]')
                        .first();

                    await expect(firstScaleRule).toBeVisible({
                        timeout: 15_000,
                    });

                    const markCreationResponsePromise =
                        memberPage.waitForResponse(
                            response =>
                                response.request().method() ===
                                    'POST' &&
                                new URL(response.url())
                                    .pathname
                                    .endsWith('/marks/new'),
                            { timeout: 15_000 },
                        );

                    await firstScaleRule.check();

                    const markCreationResponse =
                        await markCreationResponsePromise;

                    expect(
                        markCreationResponse.status(),
                        'POST marks/new did not succeed.',
                    ).toBe(200);

                    await memberPage.reload();

                    await expect(myMarkCard)
                        .toBeVisible();

                    await expect(firstScaleRule)
                        .toBeChecked();

                    const finalMarkInput = myMarkCard
                        .getByText(
                            'Итоговая оценка:',
                            { exact: true },
                        )
                        .locator('..')
                        .locator('input[type="number"]');

                    const overallComment =
                        `E2E mark ${suffix}`;

                    const overallCommentInput =
                        myMarkCard
                            .getByText(
                                'Общий комментарий:',
                                { exact: true },
                            )
                            .locator('..')
                            .locator('textarea');

                    const commentUpdateResponsePromise =
                        memberPage.waitForResponse(
                            response => {
                                if (
                                    response.request().method() !==
                                        'PUT' ||
                                    !new URL(response.url())
                                        .pathname
                                        .endsWith(
                                            '/marks/update',
                                        )
                                ) {
                                    return false;
                                }

                                try {
                                    const payload = response
                                        .request()
                                        .postDataJSON() as {
                                            comment?: string;
                                        };

                                    return payload.comment ===
                                        overallComment;
                                } catch {
                                    return false;
                                }
                            },
                            { timeout: 15_000 },
                        );

                    await overallCommentInput.fill(
                        overallComment,
                    );

                    const commentUpdateResponse =
                        await commentUpdateResponsePromise;

                    expect(
                        commentUpdateResponse.status(),
                        'PUT marks/update containing the ' +
                        'comment did not succeed.',
                    ).toBe(200);

                    await memberPage.reload();

                    await expect(myMarkCard)
                        .toBeVisible();

                    await expect(overallCommentInput)
                        .toHaveValue(overallComment);

                    const markUpdateResponsePromise =
                        memberPage.waitForResponse(
                            response => {
                                if (
                                    response.request().method() !==
                                        'PUT' ||
                                    !new URL(response.url())
                                        .pathname
                                        .endsWith(
                                            '/marks/update',
                                        )
                                ) {
                                    return false;
                                }

                                try {
                                    const payload = response
                                        .request()
                                        .postDataJSON() as {
                                            mark?: number;
                                            comment?: string;
                                        };

                                    return (
                                        Number(payload.mark) === 4 &&
                                        payload.comment ===
                                            overallComment
                                    );
                                } catch {
                                    return false;
                                }
                            },
                            { timeout: 15_000 },
                        );

                    await finalMarkInput.fill('4');

                    const markUpdateResponse =
                        await markUpdateResponsePromise;

                    expect(
                        markUpdateResponse.status(),
                        'PUT marks/update containing the ' +
                        'new final mark did not succeed.',
                    ).toBe(200);

                    await memberPage.reload();

                    await expect(finalMarkInput)
                        .toHaveValue('4');

                    await expect(overallCommentInput)
                        .toHaveValue(overallComment);

                    await returnToMemberMeeting(
                        memberPage,
                        meetingId,
                    );
                },
            );

            await test.step(
                'revoke the approved ordinary access',
                async () => {
                    const approvedRow =
                        getAccessRow(
                            page,
                            'Активные доступы участников',
                            requestedMemberName,
                        );

                    await expect(approvedRow)
                        .toBeVisible({
                            timeout: 15_000,
                        });

                    const revokeResponsePromise =
                        waitForApiResponse(
                            page,
                            'POST',
                            path =>
                                path.includes(
                                    `/meetings/${meetingId}/` +
                                    'access-requests/',
                                ) &&
                                path.endsWith('/revoke'),
                        );

                    await performWithAcceptedConfirm(
                        page,
                        () => approvedRow
                            .getByRole('button', {
                                name: 'Отозвать доступ',
                            })
                            .click(),
                    );

                    const revokeResponse =
                        await revokeResponsePromise;

                    await expectSuccessfulResponse(
                        revokeResponse,
                        'Revoking the ordinary access',
                    );

                    await expect(approvedRow)
                        .toHaveCount(0);
                },
            );

            await test.step(
                'verify that the revoked member cannot return',
                async () => {
                    await expect(memberPage)
                        .toHaveURL(
                            new RegExp(
                                `${BASENAME}/meetings/` +
                                `${meetingId}/member/login$`,
                            ),
                            {
                                timeout: 15_000,
                            },
                        );

                    await expect(
                        memberPage.getByText(
                            'Доступ к заседанию отозван.',
                            { exact: true },
                        ),
                    ).toBeVisible({
                        timeout: 15_000,
                    });

                    await expect.poll(
                        () => memberPage.evaluate(
                            key =>
                                localStorage.getItem(key),
                            `${MEETING_ACCESS_TOKEN_KEY_PREFIX}:` +
                            meetingId,
                        ),
                    ).toBeNull();

                    const jwt =
                        await memberPage.evaluate(() =>
                            sessionStorage.getItem(
                                'token',
                            ),
                        );

                    expect(jwt).toBeNull();
                },
            );
        } finally {
            await bestEffortCleanup(
                'closing the ordinary-member context',
                () => closeContext(memberContext),
            );

            await bestEffortCleanup(
                `deleting meeting "${meetingInfo}"`,
                () => deleteMeetingIfExists(page, meetingInfo),
            );

            await bestEffortCleanup(
                `deleting member "${requestedMemberName}"`,
                () => deleteMemberIfExists(
                    page,
                    requestedMemberName,
                ),
            );

            await bestEffortCleanup(
                `deleting member "${hostMember.name}"`,
                () => deleteMemberIfExists(
                    page,
                    hostMember.name,
                ),
            );
        }
    },
);

test(
    'trusted access adds an unlisted member and stops working after revocation',
    async ({ page, browser }) => {
        const suffix = createUniqueSuffix();

        const existingMeetingMember: MemberInfo = {
            name: `E2E meeting member ${suffix}`,
            email:
                `meeting-member-${suffix}@example.com`,
        };

        const trustedMember: MemberInfo = {
            name:
                `E2E trusted member ${suffix}`,
            email:
                `trusted-${suffix}@example.com`,
        };

        const meetingInfo =
            `E2E trusted access ${suffix}`;

        let trustedContext:
            BrowserContext | undefined;

        await login(page);

        try {
            await test.step(
                'create both members and issue trusted access',
                async () => {
                    await createMember(
                        page,
                        existingMeetingMember,
                    );

                    await createMember(
                        page,
                        trustedMember,
                    );
                },
            );

            const activationLink =
                await test.step(
                    'issue a personal activation link',
                    () =>
                        issueTrustedAccessLink(
                            page,
                            trustedMember.name,
                        ),
                );

            await test.step(
                'create a meeting without the trusted member',
                () =>
                    createMeeting(
                        page,
                        meetingInfo,
                        existingMeetingMember.name,
                    ),
            );

            const {
                meetingId,
                sharedLink,
            } = await openMeetingAndGetSharedLink(
                page,
                meetingInfo,
            );

            trustedContext =
                await browser.newContext();

            const trustedPage =
                await trustedContext.newPage();

            trustedPage.setDefaultTimeout(20_000);
            trustedPage.setDefaultNavigationTimeout(30_000);

            await test.step(
                'activate trusted access in another browser',
                async () => {
                    await trustedPage.goto(
                        activationLink,
                    );

                    await expect(
                        trustedPage.getByRole(
                            'heading',
                            {
                                name: 'Доступ активирован',
                            },
                        ),
                    ).toBeVisible();

                    await expect(trustedPage)
                        .toHaveURL(
                            `${BASENAME}/trusted-access`,
                        );

                    const trustedToken =
                        await trustedPage.evaluate(
                            key =>
                                localStorage.getItem(key),
                            TRUSTED_ACCESS_TOKEN_KEY,
                        );

                    expect(trustedToken)
                        .not.toBeNull();
                },
            );

            await test.step(
                'enter the meeting without an approval request',
                async () => {
                    const trustedLoginResponsePromise =
                        trustedPage.waitForResponse(
                            response =>
                                response.request().method() ===
                                    'POST' &&
                                new URL(response.url())
                                    .pathname
                                    .endsWith(
                                        `/meetings/${meetingId}` +
                                        '/trusted-login',
                                    ),
                            { timeout: 15_000 },
                        );

                    await trustedPage.goto(
                        sharedLink,
                    );

                    const trustedLoginResponse =
                        await trustedLoginResponsePromise;

                    await expectSuccessfulResponse(
                        trustedLoginResponse,
                        'Trusted member login',
                    );

                    await expect(trustedPage)
                        .toHaveURL(
                            new RegExp(
                                `${BASENAME}/meetings/` +
                                `${meetingId}/member$`,
                            ),
                            {
                                timeout: 15_000,
                            },
                        );

                    await expect(
                        trustedPage.getByRole(
                            'heading',
                            {
                                name: 'Список защищающихся студентов',
                            },
                        ),
                    ).toBeVisible();
                },
            );

            await test.step(
                'verify automatic addition to the commission',
                async () => {
                    await page.reload();

                    const commissionSection = page
                        .getByRole('heading', {
                            name: 'Список членов комиссии',
                        })
                        .locator('..');

                    await expect(
                        commissionSection.getByText(
                            trustedMember.name,
                            { exact: true },
                        ),
                    ).toBeVisible();
                },
            );

            await test.step(
                'revoke trusted access in the member card',
                () =>
                    revokeTrustedAccess(
                        page,
                        trustedMember.name,
                    ),
            );

            await test.step(
                'verify that the old trusted token is rejected',
                async () => {
                    await expect(trustedPage)
                        .toHaveURL(
                            new RegExp(
                                `${BASENAME}/meetings/` +
                                `${meetingId}/member/login$`,
                            ),
                            {
                                timeout: 15_000,
                            },
                        );

                    await expect(
                        trustedPage.getByRole(
                            'button',
                            {
                                name: 'Отправить запрос',
                            },
                        ),
                    ).toBeVisible({
                        timeout: 15_000,
                    });

                    await expect.poll(
                        () => trustedPage.evaluate(
                            key =>
                                localStorage.getItem(key),
                            TRUSTED_ACCESS_TOKEN_KEY,
                        ),
                    ).toBeNull();

                    const jwt =
                        await trustedPage.evaluate(() =>
                            sessionStorage.getItem(
                                'token',
                            ),
                        );

                    expect(jwt).toBeNull();
                },
            );
        } finally {
            await bestEffortCleanup(
                'closing the trusted-member context',
                () => closeContext(trustedContext),
            );

            await bestEffortCleanup(
                `deleting meeting "${meetingInfo}"`,
                () => deleteMeetingIfExists(page, meetingInfo),
            );

            await bestEffortCleanup(
                `deleting member "${trustedMember.name}"`,
                () => deleteMemberIfExists(
                    page,
                    trustedMember.name,
                ),
            );

            await bestEffortCleanup(
                `deleting member "${existingMeetingMember.name}"`,
                () => deleteMemberIfExists(
                    page,
                    existingMeetingMember.name,
                ),
            );
        }
    },
);

test(
    'new administrator can log in and change the password',
    async ({ page }) => {
        const suffix = createUniqueSuffix()
            .replace(/-/g, '');

        const newAdminName =
            `e2e_admin_${suffix}`;

        const initialPassword =
            `Initial-${suffix}-password`;

        const changedPassword =
            `Changed-${suffix}-password`;

        await login(page);

        await test.step(
            'create a new administrator from the profile page',
            async () => {
                await page
                    .locator('#profile-link')
                    .click();

                await expect(page).toHaveURL(
                    `${BASENAME}/profile`,
                );

                await page
                    .locator('#new-admin-username')
                    .fill(newAdminName);

                await page
                    .locator('#new-admin-password')
                    .fill(initialPassword);

                await page
                    .locator(
                        '#new-admin-password-confirmation',
                    )
                    .fill(initialPassword);

                await page
                    .locator(
                        '#admin-creation-current-password',
                    )
                    .fill(ADMIN_PASSWORD);

                const createAdminResponsePromise =
                    waitForApiResponse(
                        page,
                        'POST',
                        path => path.endsWith('/admins'),
                    );

                await page
                    .getByRole('button', {
                        name: 'Создать администратора',
                    })
                    .click();

                const createAdminResponse =
                    await createAdminResponsePromise;

                await expectSuccessfulResponse(
                    createAdminResponse,
                    `Creating administrator "${newAdminName}"`,
                );

                await expect(
                    page.getByText(
                        'Новый администратор успешно создан.',
                        { exact: true },
                    ),
                ).toBeVisible();
            },
        );

        await page.locator('#exit').click();

        await test.step(
            'log in as the new administrator',
            () =>
                login(
                    page,
                    newAdminName,
                    initialPassword,
                ),
        );

        await test.step(
            'change the new administrator password',
            async () => {
                await page
                    .locator('#profile-link')
                    .click();

                await page
                    .locator('#current-password')
                    .fill(initialPassword);

                await page
                    .locator('#new-password')
                    .fill(changedPassword);

                await page
                    .locator(
                        '#password-confirmation',
                    )
                    .fill(changedPassword);

                const changePasswordResponsePromise =
                    waitForApiResponse(
                        page,
                        'PUT',
                        path => path.endsWith(
                            '/users/me/password',
                        ),
                    );

                await page
                    .getByRole('button', {
                        name: 'Изменить пароль',
                    })
                    .click();

                const changePasswordResponse =
                    await changePasswordResponsePromise;

                await expectSuccessfulResponse(
                    changePasswordResponse,
                    `Changing password for "${newAdminName}"`,
                );

                await expect(
                    page.getByText(
                        'Пароль успешно изменён.',
                        { exact: true },
                    ),
                ).toBeVisible();

                await page.locator('#exit').click();
            },
        );

        await test.step(
            'verify that the old password no longer works',
            async () => {
                await page
                    .locator('#username')
                    .fill(newAdminName);

                await page
                    .locator('#password')
                    .fill(initialPassword);

                const rejectedLoginResponsePromise =
                    waitForApiResponse(
                        page,
                        'POST',
                        path => path.endsWith('/login'),
                    );

                await page
                    .getByRole('button', {
                        name: 'Войти',
                    })
                    .click();

                const rejectedLoginResponse =
                    await rejectedLoginResponsePromise;

                expect(
                    rejectedLoginResponse.status(),
                    'The old administrator password ' +
                    'must be rejected.',
                ).toBe(401);

                await expect(page).toHaveURL(
                    `${BASENAME}/login`,
                );

                await expect.poll(
                    () => page.evaluate(() =>
                        sessionStorage.getItem('token'),
                    ),
                ).toBeNull();
            },
        );

        await test.step(
            'verify that the new password works',
            () =>
                login(
                    page,
                    newAdminName,
                    changedPassword,
                ),
        );
    },
);
