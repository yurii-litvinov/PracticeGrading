import axios from 'axios';
import {Criteria} from '../interfaces/Criteria'
import {Meeting} from '../interfaces/Meeting'

const token = sessionStorage.getItem('token');

const axiosService = axios.create({
    baseURL: 'http://localhost:5001/',
    headers: {
        Authorization: token ? `Bearer ${token}` : '',
    },
});

axiosService.interceptors.response.use(
    (response) => {
        return response;
    },

    (error) => {
        console.log(error)
        if (error.response.status === 403 || error.response.status === 401) {
            window.location.replace("/login");
        }
        return Promise.reject(error);
    }
)

export const setAuthHeader = (token: string) =>
    axiosService.defaults.headers['Authorization'] = `Bearer ${token}`;

export const loginAdmin = async (userName: string, password: string) =>
    await axiosService.post(`login`, {userName, password});
export const getMeetings = async (id?: number) =>
    await axiosService.get(`meetings`, {params: {id}});
export const createMeeting = async (meeting: Meeting) =>
    await axiosService.post(`meetings/new`, {
        ...meeting,
        members: meeting.members.filter(member => member !== '')
    });

export const updateMeeting = async (meeting: Meeting) =>
    await axiosService.put(`meetings/update`, {
        ...meeting,
        members: meeting.members.filter(member => member !== '')
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