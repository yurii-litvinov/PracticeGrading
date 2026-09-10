import axios from "axios";
import { Criteria } from "../models/Criteria";
import { Meeting } from "../models/Meeting";
import { CriteriaGroup } from "../models/CriteriaGroup";
import { MemberMark } from "../models/MemberMark";
import { BASENAME } from "../App";
import { Member } from "../models/Member";
import { TrustedMemberAccessStatus } from "../models/TrustedMemberAccessStatus";

import {
    MeetingMemberAccessStatusInfo,
    PendingMeetingMemberAccess,
    ApprovedMeetingMemberAccess,
} from "../models/MeetingMemberAccess";

const token = sessionStorage.getItem("token");

const axiosService = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        Authorization: token ? `Bearer ${token}` : "",
    },
});

axiosService.interceptors.response.use(
    (response) => response,

    (error) => {
        console.log(
            'Ошибка запроса:',
            error.config?.url,
            error.response?.status,
            error.response?.data,
        );

        const requestUrl = error.config?.url ?? '';

        const isAccessAuthenticationRequest =
            requestUrl === "login" ||
            requestUrl.includes('trusted-login') ||
            requestUrl.includes('member-login') ||
            requestUrl.includes('access-requests/status') ||
            requestUrl.includes('read-only');

        const status = error.response?.status;
        const currentPath = window.location.pathname;

        const memberPageMatch = currentPath.match(
            /\/meetings\/(\d+)\/member(?:\/|$)/,
        );

        const meetingId = memberPageMatch?.[1];

        const shouldClearAuthentication =
            status === 401 ||
            (status === 403 && meetingId !== undefined);

        if (
            shouldClearAuthentication &&
            !isAccessAuthenticationRequest
        ) {
            sessionStorage.removeItem('token');

            delete axiosService.defaults
                .headers.common.Authorization;

            if (meetingId) {
                window.location.replace(
                    `${BASENAME}/meetings/${meetingId}/member/login`,
                );
            } else {
                window.location.replace(
                    `${BASENAME}/login`,
                );
            }
        }

        return Promise.reject(error);
    },
);

export const setAuthHeader = (token: string) =>
    (axiosService.defaults.headers["Authorization"] = `Bearer ${token}`);

export const loginAdmin = async (userName: string, password: string) =>
    await axiosService.post(`login`, { userName, password });

export const getMeetings = async (id?: number) =>
    await axiosService.get(`meetings`, { params: { id } });

export const createMeeting = async (meeting: Meeting) =>
    await axiosService.post(`meetings/new`, {
        ...meeting,
        memberIds: meeting.members.map((member) => member.id),
        members: undefined,
        CriteriaGroupId: meeting.criteriaGroup?.id,
    });

export const updateMeeting = async (meeting: Meeting) =>
    await axiosService.put(`meetings/update`, {
        ...meeting,
        memberIds: meeting.members.map((member) => member.id),
        members: undefined,
        CriteriaGroupId: meeting.criteriaGroup?.id,
    });

export const deleteMeeting = async (id: number) =>
    await axiosService.delete(`meetings/delete`, { params: { id } });

export const getCriteriaGroup = async (id?: number) =>
    await axiosService.get(`criteriaGroup`, { params: { id } });

export const createCriteriaGroup = async (group: CriteriaGroup) =>
    await axiosService.post(`criteriaGroup/new`, {
        ...group,
        criteriaId: group.criteria.map((criteria) => criteria.id),
        markScales: group.markScales.filter(
            (scale) =>
                scale.min !== undefined &&
                scale.max !== undefined &&
                scale.min < scale.max &&
                scale.mark !== "",
        ),
    });

export const updateCriteriaGroup = async (group: CriteriaGroup) =>
    await axiosService.put(`criteriaGroup/update`, {
        ...group,
        criteriaId: group.criteria.map((criteria) => criteria.id),
        markScales: group.markScales.filter(
            (scale) =>
                scale.min !== undefined &&
                scale.max !== undefined &&
                scale.min < scale.max &&
                scale.mark !== "",
        ),
    });

export const deleteCriteriaGroup = async (id: number) =>
    await axiosService.delete(`criteriaGroup/delete`, { params: { id } });

export const getCriteria = async (id?: number) =>
    await axiosService.get(`criteria`, { params: { id } });

export const createCriteria = async (criteria: Criteria) =>
    await axiosService.post(`criteria/new`, criteria);

export const updateCriteria = async (criteria: Criteria) =>
    await axiosService.put(`criteria/update`, criteria);

export const deleteCriteria = async (id: number) =>
    await axiosService.delete(`criteria/delete`, { params: { id } });

export const getMembers = async (id: number) =>
    await axiosService.get(`meetings/members`, { params: { id } });

export const getMemberMarks = async (workId: number, memberId?: number) =>
    await axiosService.get(`marks/`, { params: { memberId, workId } });

export const createMemberMark = async (memberMark: MemberMark) =>
    await axiosService.post(`marks/new`, memberMark);

export const updateMemberMark = async (memberMark: MemberMark) =>
    await axiosService.put(`marks/update`, memberMark);

export const deleteMemberMark = async (workId: number, memberId: number) =>
    await axiosService.delete(`marks/delete`, { params: { memberId, workId } });

export const setFinalMark = async (
    meetingId: number,
    workId: number,
    mark: string,
) =>
    await axiosService.put(
        `meetings/setMark?meetingId=${meetingId}&workId=${workId}&mark=${mark}`,
    );

export const createMeetingsFromFile = async (formData: FormData) =>
    await axiosService.post(`meetings/fromFile`, formData);

export const uploadTheses = async (formData: FormData) =>
    await axiosService.post(`meetings/uploadTheses`, formData);

export const getMarkTable = async (id: number) =>
    await axiosService.get(`meetings/getMarkTable`, {
        params: { id },
        responseType: "blob",
    });

export const getMarkTableForStudents = async (id: number) =>
    await axiosService.get(`meetings/getMarkTableForStudents`, {
        params: { id },
        responseType: "blob",
    });

export const getDocuments = async (
    meetingId: number,
    coordinator: string,
    chairmanId: number,
    secretary: string,
    chairmanOrder: string,
) =>
    await axiosService.get(`meetings/getDocuments`, {
        params: {
            meetingId,
            coordinator,
            chairmanId,
            chairmanOrder,
            secretary,
        },
        responseType: "blob",
    });

export const searchMembers = async (
    searchName: string,
    offset: number,
    limit: number,
    signal?: AbortSignal,
) =>
    await axiosService.get("members", {
        params: {
            searchName,
            offset,
            limit,
        },
        signal,
    });

export const updateMember = async (member: Member) => {
    await axiosService.put(`members`, member);
};

export const addMember = async (member: Member) => {
    return await axiosService.post("members", member);
};

export const deleteMember = async (id: number) => {
    await axiosService.delete(`members?id=${id}`);
};

export const changePassword = async (
    currentPassword: string,
    newPassword: string,
) =>
    await axiosService.put("users/me/password", {
        currentPassword,
        newPassword,
    });

export const createAdmin = async (
    userName: string,
    password: string,
    currentPassword: string,
) => {
    await axiosService.post("admins", {
        userName,
        password,
        currentPassword,
    });
};

export const getTrustedMemberAccessStatus = async (memberId: number) =>
    await axiosService.get<TrustedMemberAccessStatus>(
        `members/${memberId}/trusted-access`,
    );

export const issueTrustedMemberAccess = async (memberId: number) =>
    await axiosService.post<{ token: string }>(
        `members/${memberId}/trusted-access`,
    );

export const revokeTrustedMemberAccess = async (memberId: number) =>
    await axiosService.delete(`members/${memberId}/trusted-access`);

export const loginTrustedMember = async (
    meetingId: number,
    trustedAccessToken: string,
) =>
    await axiosService.post<{ token: string }>(
        `meetings/${meetingId}/trusted-login`,
        undefined,
        {
            headers: {
                "X-Trusted-Access-Token": trustedAccessToken,
            },
        },
    );

export const createMeetingAccessRequest = async (
    meetingId: number,
    credentials: {
        memberId?: number;
        userName?: string;
    },
) =>
    await axiosService.post<{ token: string }>(
        `meetings/${meetingId}/access-requests`,
        credentials,
    );

export const getMeetingAccessStatus = async (
    meetingId: number,
    accessToken: string,
) =>
    await axiosService.get<MeetingMemberAccessStatusInfo>(
        `meetings/${meetingId}/access-requests/status`,
        {
            headers: {
                "X-Meeting-Access-Token": accessToken,
            },
        },
    );

export const loginApprovedMeetingMember = async (
    meetingId: number,
    accessToken: string,
) =>
    await axiosService.post<{ token: string }>(
        `meetings/${meetingId}/member-login`,
        undefined,
        {
            headers: {
                "X-Meeting-Access-Token": accessToken,
            },
        },
    );

export const getPendingMeetingAccessRequests = async (
    meetingId: number,
) =>
    await axiosService.get<PendingMeetingMemberAccess[]>(
        `meetings/${meetingId}/access-requests/pending`,
    );

export const approveMeetingAccessRequest = async (
    meetingId: number,
    accessId: number,
) =>
    await axiosService.post(
        `meetings/${meetingId}/access-requests/${accessId}/approve`,
    );

export const rejectMeetingAccessRequest = async (
    meetingId: number,
    accessId: number,
) =>
    await axiosService.post(
        `meetings/${meetingId}/access-requests/${accessId}/reject`,
    );

export const getReadOnlyMeeting = async (
    meetingId: number,
    accessToken: string,
) =>
    await axiosService.get<Meeting>(
        `meetings/${meetingId}/read-only`,
        {
            headers: {
                'X-Meeting-Access-Token': accessToken,
            },
        },
    );

export const getApprovedMeetingAccesses = async (
    meetingId: number,
) =>
    await axiosService.get<
        ApprovedMeetingMemberAccess[]
    >(
        `meetings/${meetingId}/access-requests/approved`,
    );

export const revokeMeetingAccess = async (
    meetingId: number,
    accessId: number,
) =>
    await axiosService.post(
        `meetings/${meetingId}/access-requests/${accessId}/revoke`,
    );