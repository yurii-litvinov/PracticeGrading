import axios from 'axios';
import {Criteria} from '../models/Criteria'
import {Meeting} from '../models/Meeting'

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
                window.location.replace(`/meetings/${meetingId}/member/login`);
            } else {
                window.location.replace("/login");
            }
        }
        return Promise.reject(error);
    }
);


export const setAuthHeader = (token: string) =>
    axiosService.defaults.headers['Authorization'] = `Bearer ${token}`;

export const loginAdmin = async (userName: string, password: string) =>
    await axiosService.post(`login`, {userName, password});

export const getMeetings = async (id?: number) =>
    await axiosService.get(`meetings`, {params: {id}});

export const createMeeting = async (meeting: Meeting) =>
    await axiosService.post(`meetings/new`, {
        ...meeting,
        members: meeting.members.filter(member => member.name !== ''),
        criteriaId: meeting.criteria.map(criteria => criteria.id)
    });

export const updateMeeting = async (meeting: Meeting) =>
    await axiosService.put(`meetings/update`, {
        ...meeting,
        members: meeting.members.filter(member => member.name !== ''),
        criteriaId: meeting.criteria.map(criteria => criteria.id)
    });

export const deleteMeeting = async (id: number) =>
    await axiosService.delete(`meetings/delete`, {params: {id}})

export const getCriteria = async (id?: number) =>
    await axiosService.get(`criteria`, {params: {id}});

export const createCriteria = async (criteria: Criteria) =>
    await axiosService.post(`criteria/new`, criteria);

export const updateCriteria = async (criteria: Criteria) =>
    await axiosService.put(`criteria/update`, criteria);

export const deleteCriteria = async (id: number) =>
    await axiosService.delete(`criteria/delete`, {params: {id}})

export const getMembers = async (id: number) =>
    await axiosService.get(`meetings/members`, {params: {id}})

export const loginMember = async (userName: string, meetingId: int) =>
    await axiosService.post(`member/login`, {userName, meetingId});

export const getMemberMarks = async (workId: number, memberId?: number) =>
    await axiosService.get(`marks/`, {params: {memberId, workId}});

export const createMemberMark = async (memberMark) =>
    await axiosService.post(`marks/new`, memberMark);

export const updateMemberMark = async (memberMark) =>
    await axiosService.put(`marks/update`, memberMark);

export const deleteMemberMark = async (workId: number, memberId: number) =>
    await axiosService.delete(`marks/delete`, {params: {memberId, workId}})

export const setFinalMark = async (meetingId: number, workId: number, mark: number) =>
    await axiosService.put(`meetings/setmark?meetingId=${meetingId}&workId=${workId}&mark=${mark}`)