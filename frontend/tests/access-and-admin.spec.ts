/// <reference types="node" />

import {
    expect,
    test,
    type BrowserContext,
    type Page,
} from '@playwright/test';

// Run this suite only against a disposable E2E database.
// The application currently has no endpoint for deleting administrators.

const ADMIN_USERNAME =
    process.env.E2E_ADMIN_USERNAME ?? 'admin';

const ADMIN_PASSWORD =
    process.env.E2E_ADMIN_PASSWORD ?? 'admin';

const BASENAME = '/practice-grading';

const TRUSTED_ACCESS_TOKEN_KEY =
    'trusted-member-access-token';

const MEETING_ACCESS_TOKEN_KEY_PREFIX =
    'meeting-member-access-token';

test.setTimeout(90_000);
test.describe.configure({ mode: 'serial' });

type MemberInfo = {
    name: string;
    email: string;
};

const createUniqueSuffix = () =>
    `${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`;

const login = async (
    page: Page,
    userName = ADMIN_USERNAME,
    password = ADMIN_PASSWORD,
) => {
    await page.goto(`${BASENAME}/login`);

    await page.locator('#username').fill(userName);
    await page.locator('#password').fill(password);

    await page
        .getByRole('button', { name: 'Войти' })
        .click();

    await expect(page).toHaveURL(
        `${BASENAME}/meetings`,
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
    );
};

const openMeetingsPage = async (page: Page) => {
    await page.locator('#meetings-link').click();

    await expect(page).toHaveURL(
        `${BASENAME}/meetings`,
    );
};

const findMemberCard = async (
    page: Page,
    memberName: string,
) => {
    const searchInput =
        page.locator('#search-input');

    await searchInput.fill('');
    await searchInput.fill(memberName);

    const memberCard =
        getMemberCard(page, memberName);

    await expect(memberCard).toHaveCount(1);

    return memberCard;
};

const createMember = async (
    page: Page,
    member: MemberInfo,
) => {
    await openMembersPage(page);

    await page
        .locator('#search-input')
        .fill(member.name);

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

    await modal
        .locator('#form-submit-button')
        .click();

    await expect(modal).toBeHidden();
    await expect(
        getMemberCard(page, member.name),
    ).toHaveCount(1);
};

const deleteMemberIfExists = async (
    page: Page,
    memberName: string,
) => {
    await openMembersPage(page);

    await page
        .locator('#search-input')
        .fill(memberName);

    const memberCard =
        getMemberCard(page, memberName);

    if (await memberCard.count() === 0) {
        return;
    }

    await expect(memberCard).toHaveCount(1);
    await memberCard.click();

    const modal = page.locator('.modal.show');

    page.once('dialog', dialog => {
        void dialog.accept();
    });

    await modal
        .locator('#delete-member-button')
        .click();

    await expect(modal).toBeHidden();
    await expect(memberCard).toHaveCount(0);
};

const createMeeting = async (
    page: Page,
    meetingInfo: string,
    initialMemberName: string,
) => {
    await openMeetingsPage(page);

    await page
        .locator('#create-meeting')
        .click();

    await expect(page).toHaveURL(
        `${BASENAME}/meetings/new`,
    );

    await page
        .locator('input[name="auditorium"]')
        .fill('3389');

    await page
        .locator('input[name="info"]:visible')
        .fill(meetingInfo);

    await page
        .locator('#add-student')
        .click();

    const studentModal =
        page.locator('#studentWorkModal');

    await expect(studentModal).toBeVisible();

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

    await expect(studentModal).toBeHidden();

    await page
        .locator('#search-input')
        .fill(initialMemberName);

    const memberOption = page
        .locator('.dropdown-item')
        .filter({ hasText: initialMemberName });

    await expect(memberOption).toHaveCount(1);
    await memberOption.click();

    const criteriaGroup = page
        .locator('input[name^="criteria-"] + label')
        .filter({
            hasText: 'Критерии для учебных практик',
        });

    await expect(criteriaGroup).toHaveCount(1);
    await criteriaGroup.click();

    await page
        .locator('#save-meeting')
        .click();

    await expect(page).toHaveURL(
        `${BASENAME}/meetings`,
    );

    await expect(
        getMeetingCard(page, meetingInfo),
    ).toHaveCount(1);
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
    );

    const sharedLink =
        (await page.locator('#copy').innerText())
            .trim();

    const meetingIdMatch = new URL(sharedLink)
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
    await openMeetingsPage(page);

    const meetingCard =
        getMeetingCard(page, meetingInfo);

    if (await meetingCard.count() === 0) {
        return;
    }

    page.once('dialog', dialog => {
        void dialog.accept();
    });

    await meetingCard
        .locator('#delete-meeting')
        .click();

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
        .filter({ hasText: memberName });

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

    await modal
        .getByRole('button', {
            name: 'Выдать ссылку',
            exact: true,
        })
        .click();

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

    await expect(modal).toBeHidden();

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

    page.once('dialog', dialog => {
        void dialog.accept();
    });

    await revokeButton.click();

    await expect(
        modal.getByText('Отозван', {
            exact: true,
        }),
    ).toBeVisible();

    await modal
        .locator('button[aria-label="Close"]')
        .click();

    await expect(modal).toBeHidden();

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
    if (context) {
        await context.close();
    }
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

                    await memberPage
                        .getByRole('button', {
                            name: 'Отправить запрос',
                        })
                        .click();

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

                    await pendingRow
                        .getByRole('button', {
                            name: 'Подтвердить',
                        })
                        .click();

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

                    await memberPage
                        .getByRole('button', {
                            name: 'Назад к заседанию',
                            exact: true,
                        })
                        .click();

                    await expect(memberPage)
                        .toHaveURL(
                            new RegExp(
                                `${BASENAME}/meetings/` +
                                `${meetingId}/member$`,
                            ),
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

                    page.once(
                        'dialog',
                        dialog => {
                            void dialog.accept();
                        },
                    );

                    await approvedRow
                        .getByRole('button', {
                            name: 'Отозвать доступ',
                        })
                        .click();

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
            await closeContext(memberContext);

            await deleteMeetingIfExists(
                page,
                meetingInfo,
            );

            await deleteMemberIfExists(
                page,
                requestedMemberName,
            );

            await deleteMemberIfExists(
                page,
                hostMember.name,
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

                    const trustedLoginBody = await
                        trustedLoginResponse
                            .text()
                            .catch(error =>
                                '<response body unavailable: ' +
                                `${String(error)}>`,
                            );

                    expect(
                        trustedLoginResponse.status(),
                        'POST trusted-login returned ' +
                        `${trustedLoginResponse.status()}: ` +
                        trustedLoginBody,
                    ).toBe(200);

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
            await closeContext(trustedContext);

            await deleteMeetingIfExists(
                page,
                meetingInfo,
            );

            await deleteMemberIfExists(
                page,
                trustedMember.name,
            );

            await deleteMemberIfExists(
                page,
                existingMeetingMember.name,
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

                await page
                    .getByRole('button', {
                        name: 'Создать администратора',
                    })
                    .click();

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

                await page
                    .getByRole('button', {
                        name: 'Изменить пароль',
                    })
                    .click();

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

                const dialogPromise = page
                    .waitForEvent('dialog')
                    .then(async dialog => {
                        expect(dialog.message()).toBe(
                            'Неверный логин или пароль',
                        );

                        await dialog.accept();
                    });

                await page
                    .getByRole('button', {
                        name: 'Войти',
                    })
                    .click();

                await dialogPromise;

                await expect(page).toHaveURL(
                    `${BASENAME}/login`,
                );
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