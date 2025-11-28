import axios from 'axios';
import { Criteria } from '../models/Criteria'
import { Meeting } from '../models/Meeting'
import { CriteriaGroup } from '../models/CriteriaGroup'
import { MemberMark } from '../models/MemberMark'
import { BASENAME } from "../App"
import { Member } from '../models/Member';

const token = sessionStorage.getItem('token');

const axiosService = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        Authorization: token ? `Bearer ${token}` : '',
    },
});

axiosService.interceptors.response.use(
    (response) => {
        return response;
    },

    (error) => {
        console.log(error);
        if (error.response.status === 403 || error.response.status === 401) {
            const currentPath = window.location.pathname;
            const match = currentPath.match(/\/meetings\/(\d+)\/member/);
            const meetingId = match ? match[1] : null;

            if (meetingId) {
                window.location.replace(`${BASENAME}/meetings/${meetingId}/member/login`);
            } else {
                window.location.replace(`${BASENAME}/login`);
            }
        }
        return Promise.reject(error);
    }
);


export const setAuthHeader = (token: string) =>
    axiosService.defaults.headers['Authorization'] = `Bearer ${token}`;

export const loginAdmin = async (userName: string, password: string) =>
    await axiosService.post(`login`, { userName, password });

export const getMeetings = async (id?: number) =>
    await axiosService.get(`meetings`, { params: { id } });

export const createMeeting = async (meeting: Meeting) =>
    await axiosService.post(`meetings/new`, {
        ...meeting,
        memberIds: meeting.members.map(member => member.id),
        members: undefined,
        CriteriaGroupId: meeting.criteriaGroup?.id,
    });

export const updateMeeting = async (meeting: Meeting) =>
    await axiosService.put(`meetings/update`, {
        ...meeting,
        memberIds: meeting.members.map(member => member.id),
        members: undefined,
        CriteriaGroupId: meeting.criteriaGroup?.id
    });

export const deleteMeeting = async (id: number) =>
    await axiosService.delete(`meetings/delete`, { params: { id } })

export const getCriteriaGroup = async (id?: number) =>
    await axiosService.get(`criteriaGroup`, { params: { id } });

export const createCriteriaGroup = async (group: CriteriaGroup) =>
    await axiosService.post(`criteriaGroup/new`, {
        ...group,
        criteriaId: group.criteria.map(criteria => criteria.id),
        markScales: group.markScales.filter(scale => scale.min !== undefined && scale.max !== undefined && scale.min < scale.max && scale.mark !== '')
    });

export const updateCriteriaGroup = async (group: CriteriaGroup) =>
    await axiosService.put(`criteriaGroup/update`, {
        ...group,
        criteriaId: group.criteria.map(criteria => criteria.id),
        markScales: group.markScales.filter(scale => scale.min !== undefined && scale.max !== undefined && scale.min < scale.max && scale.mark !== '')
    });

export const deleteCriteriaGroup = async (id: number) =>
    await axiosService.delete(`criteriaGroup/delete`, { params: { id } })

export const getCriteria = async (id?: number) =>
    await axiosService.get(`criteria`, { params: { id } });

export const createCriteria = async (criteria: Criteria) =>
    await axiosService.post(`criteria/new`, criteria);

export const updateCriteria = async (criteria: Criteria) =>
    await axiosService.put(`criteria/update`, criteria);

export const deleteCriteria = async (id: number) =>
    await axiosService.delete(`criteria/delete`, { params: { id } })

export const getMembers = async (id: number) =>
    await axiosService.get(`meetings/members`, { params: { id } })

export const loginMember = async (meetingId: number, credentials: { userName?: string, member?: Member }) =>
    await axiosService.post(`member/login`, { memberId: credentials.member?.id, userName: credentials.userName, meetingId });

export const getMemberMarks = async (workId: number, memberId?: number) =>
    await axiosService.get(`marks/`, { params: { memberId, workId } });

export const createMemberMark = async (memberMark: MemberMark) =>
    await axiosService.post(`marks/new`, memberMark);

export const updateMemberMark = async (memberMark: MemberMark) =>
    await axiosService.put(`marks/update`, memberMark);

export const deleteMemberMark = async (workId: number, memberId: number) =>
    await axiosService.delete(`marks/delete`, { params: { memberId, workId } });

export const setFinalMark = async (meetingId: number, workId: number, mark: string) =>
    await axiosService.put(`meetings/setMark?meetingId=${meetingId}&workId=${workId}&mark=${mark}`);

export const createMeetingsFromFile = async (formData: FormData) =>
    await axiosService.post(`meetings/fromFile`, formData);

export const uploadTheses = async (formData: FormData) =>
    await axiosService.post(`meetings/uploadTheses`, formData);

export const getMarkTable = async (id: number) =>
    await axiosService.get(`meetings/getMarkTable`, { params: { id }, responseType: 'blob' });

export const getMarkTableForStudents = async (id: number) =>
    await axiosService.get(`meetings/getMarkTableForStudents`, { params: { id }, responseType: 'blob' });

export const getDocuments = async (id: number, coordinator: string, chairman: string) =>
    await axiosService.get(`meetings/getDocuments`, { params: { id, coordinator, chairman }, responseType: 'blob' });

export const searchMembers = async (searchName: string, offset: number, limit: number) =>
    await axiosService.get(`members?searchName=${searchName}&offset=${offset}&limit=${limit}`)

export const updateMember = async (member: Member) => {
    await axiosService.put(`members`, member)
}

export const addMember = async (member: Member) => {
    await axiosService.post('members', member);
}

export const deleteMember = async (id: number) => {
    await axiosService.delete(`members?id=${id}`);
}