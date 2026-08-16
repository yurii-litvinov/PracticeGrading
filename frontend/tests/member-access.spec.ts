/// <reference types="node" />

import { expect, test, type BrowserContext } from "@playwright/test";

const APP_BASE = "/practice-grading";

const API_URL = process.env.E2E_API_URL ?? "http://localhost:5183";

const ADMIN_USERNAME =
    process.env.E2E_ADMIN_USERNAME ?? 'admin';

const ADMIN_PASSWORD =
    process.env.E2E_ADMIN_PASSWORD ?? 'admin';

test.setTimeout(60_000);

test("member requests access and admin approves it", async ({
    browser,
    request,
}) => {
    const uniqueId = Date.now();

    const meetingInfo = `E2E access meeting ${uniqueId}`;

    const memberName = `E2E member ${uniqueId}`;

    let meetingId: number | undefined;
    let adminToken: string | undefined;

    let adminContext: BrowserContext | undefined;
    let memberContext: BrowserContext | undefined;

    try {
        const loginResponse = await request.post(`${API_URL}/login`, {
            data: {
                userName: ADMIN_USERNAME,
                password: ADMIN_PASSWORD,
            },
        });

        expect(loginResponse.ok()).toBeTruthy();

        const loginBody = (await loginResponse.json()) as {
            token: string;
        };

        adminToken = loginBody.token;

        const authorizationHeaders = {
            Authorization: `Bearer ${adminToken}`,
        };

        const createMeetingResponse = await request.post(
            `${API_URL}/meetings/new`,
            {
                headers: authorizationHeaders,

                data: {
                    id: null,
                    dateAndTime: new Date().toISOString(),
                    auditorium: "E2E",
                    info: meetingInfo,
                    callLink: null,
                    materialsLink: null,
                    studentWorks: [
                        {
                            id: null,
                            studentName: "E2E student",
                            info: null,
                            theme: "E2E theme",
                            supervisor: "E2E supervisor",
                            supervisorInfo: null,
                            consultant: null,
                            reviewer: null,
                            reviewerInfo: null,
                            supervisorMark: null,
                            reviewerMark: null,
                            codeLink: null,
                            reportLink: null,
                            supervisorReviewLink: null,
                            consultantReviewLink: null,
                            reviewerReviewLink: null,
                            additionalLink: null,
                        },
                    ],
                    memberIds: [],
                    criteriaGroupId: 1,
                },
            },
        );

        expect(createMeetingResponse.ok()).toBeTruthy();

        const meetingsResponse = await request.get(`${API_URL}/meetings`, {
            headers: authorizationHeaders,
        });

        expect(meetingsResponse.ok()).toBeTruthy();

        const meetings = (await meetingsResponse.json()) as Array<{
            id: number;
            info: string | null;
        }>;

        const createdMeeting = meetings.find(
            (meeting) => meeting.info === meetingInfo,
        );

        if (!createdMeeting) {
            throw new Error("Created meeting was not found.");
        }

        meetingId = createdMeeting.id;

        adminContext = await browser.newContext();

        await adminContext.addInitScript((token) => {
            sessionStorage.setItem("token", token);
        }, adminToken);

        memberContext = await browser.newContext();

        const adminPage = await adminContext.newPage();

        const memberPage = await memberContext.newPage();

        await adminPage.goto(`${APP_BASE}/meetings/${meetingId}`);

        await memberPage.goto(`${APP_BASE}/meetings/${meetingId}/member`);

        await expect(memberPage).toHaveURL(
            new RegExp(`/meetings/${meetingId}/member/login$`),
        );

        await memberPage.getByTestId("member-name-input").fill(memberName);

        await memberPage.getByTestId("member-access-submit").click();

        await expect(
            memberPage.getByTestId("member-access-pending"),
        ).toBeVisible();

        const requestCard = adminPage
            .getByTestId("pending-access-request")
            .filter({
                hasText: memberName,
            });

        await expect(requestCard).toBeVisible({
            timeout: 10_000,
        });

        await requestCard
            .getByRole("button", {
                name: "Подтвердить",
            })
            .click();

        await expect(memberPage).toHaveURL(
            new RegExp(`/meetings/${meetingId}/member$`),
            {
                timeout: 15_000,
            },
        );

        const memberMeetingPage = memberPage.getByTestId("member-meeting-page");

        await expect(memberMeetingPage).toBeVisible();

        await expect(memberMeetingPage.getByText(meetingInfo)).toBeVisible();

        const memberJwt = await memberPage.evaluate(() =>
            sessionStorage.getItem("token"),
        );

        expect(memberJwt).not.toBeNull();
    } finally {
        await memberContext?.close();
        await adminContext?.close();

        if (adminToken && meetingId) {
            const authorizationHeaders = {
                Authorization: `Bearer ${adminToken}`,
            };

            await request.delete(`${API_URL}/meetings/delete`, {
                headers: authorizationHeaders,
                params: {
                    id: meetingId,
                },
            });

            const membersResponse = await request.get(`${API_URL}/members`, {
                headers: authorizationHeaders,
                params: {
                    searchName: memberName,
                    offset: 0,
                    limit: 10,
                },
            });

            if (membersResponse.ok()) {
                const result = (await membersResponse.json()) as {
                    members: Array<{
                        id: number;
                        name: string;
                    }>;
                };

                const createdMember = result.members.find(
                    (member) => member.name === memberName,
                );

                if (createdMember) {
                    await request.delete(`${API_URL}/members`, {
                        headers: authorizationHeaders,
                        params: {
                            id: createdMember.id,
                        },
                    });
                }
            }
        }
    }
});
