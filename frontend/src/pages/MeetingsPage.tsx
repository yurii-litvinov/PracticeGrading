import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {getMeetings, deleteMeeting} from '../services/ApiService';
import {format} from 'date-fns';
import {ru} from 'date-fns/locale';

export const formatDate = (date) => {
    return format(new Date(date), 'd MMMM yyyy, HH:mm', {locale: ru});
}

export function MeetingsPage() {
    const [meetings, setMeetings] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        getMeetings().then(response => setMeetings(response.data));
    }, []);

    const handleNewMeeting = () => {
        navigate("/meetings/new", {replace: true});
    }

    const handleDeleteMeeting = async (id) => {
        const isConfirmed = window.confirm('Вы уверены, что хотите удалить это заседание?');
        if (isConfirmed) {
            await deleteMeeting(id);
            getMeetings().then(response => setMeetings(response.data));
        }
    }

    const handleViewMeeting = async (id) => {
        navigate(`/meetings/${id}`, {replace: true});
    }

    return (
        <>
            <div className="d-flex flex-column flex-sm-row align-items-start justify-content-end ps-2 pb-2 w-100">
                <h1 className="me-auto w-100 mb-3 mb-sm-0 text-center text-sm-start">Заседания</h1>
                <div className="d-flex flex-column flex-sm-row justify-content-end w-100">
                    <button type="button" className="btn btn-primary btn-lg mb-2 mb-sm-0 me-sm-2"
                            id="create-meeting" onClick={handleNewMeeting}>Создать заседание
                    </button>
                </div>
            </div>
            
            <div className="row">
                {meetings.map((meeting) => (
                    <div key={meeting.id} className="col-md-4 mb-4">
                        <div className="card">
                            <div className="card-body">
                                <h4 className="card-title pb-2 text-primary" id="info">{meeting.info}</h4>
                                <p className="card-text">
                                    <strong>Дата:</strong> {formatDate(meeting.dateAndTime)}<br/>
                                    <strong>Аудитория:</strong> {meeting.auditorium}
                                </p>
                                <button className="btn btn-outline-primary me-2" id="view_meeting"
                                        onClick={() => handleViewMeeting(meeting.id)}>
                                    Перейти
                                </button>
                                <button className="btn btn-outline-danger" id="delete-meeting"
                                        onClick={() => handleDeleteMeeting(meeting.id)}>
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

