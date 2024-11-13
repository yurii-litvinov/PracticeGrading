import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import {getMeetings, deleteMeeting} from '../services/apiService';
import {format} from 'date-fns';
import {ru} from 'date-fns/locale';

const formatDate = (date) => {
    return format(new Date(date), 'dd MMMM yyyy, HH:mm', {locale: ru});
}

export function MeetingsPage() {
    const [meetings, setMeetings] = useState([]);
    const navigate = useNavigate();

    const fetchMeetings = async () => {
        const token = sessionStorage.getItem('token');

        if (!token) {
            navigate("/login", {replace: true});
            return;
        }

        getMeetings().then(response => setMeetings(response.data));
    }
    
    useEffect(() => {
        fetchMeetings();
    }, []);

    const handleNewMeeting = () => {
        navigate("/meetings/new", {replace: true});
    }

    const handleDeleteMeeting = async (id) => {
        await deleteMeeting(id);
        fetchMeetings();
    }

    return (
        <>
            <div className="d-flex align-items-center justify-content-end ps-2 pb-2">
                <h1 className="me-auto">Заседания</h1>
                <button type="button" className="btn btn-primary btn-lg" onClick={handleNewMeeting}>
                    Создать заседание
                </button>
            </div>


            <div className="row">
                {meetings.map((meeting) => (
                    <div key={meeting.id} className="col-md-4 mb-4">
                        <div className="card">
                            <div className="card-body">
                                <h5 className="card-title">{meeting.info}</h5>
                                <p className="card-text">
                                    <strong>Дата:</strong> {formatDate(meeting.dateAndTime)}<br/>
                                    <strong>Аудитория:</strong> {meeting.auditorium}
                                </p>
                                <button className="btn btn-outline-danger" onClick={() => handleDeleteMeeting(meeting.id)}>
                                    Удалить
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}

