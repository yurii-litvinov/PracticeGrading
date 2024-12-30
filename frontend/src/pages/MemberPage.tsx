import React, {useEffect, useState, useRef} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {getMeetings, getCriteria} from '../services/ApiService';
import 'react-datepicker/dist/react-datepicker.css';
import {formatDate} from './MeetingsPage';
import {SignalRService} from '../services/SignalRService';
import {Actions} from '../models/Actions';

export function MemberPage() {
    const {id} = useParams();
    const navigate = useNavigate();
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [criteria, setCriteria] = useState([]);
    const [meeting, setMeeting] = useState({
        dateAndTime: new Date(),
        auditorium: '',
        info: '',
        callLink: '',
        materialsLink: '',
        studentWorks: [],
        members: [''],
        criteriaId: []
    });

    const signalRService = useRef<SignalRService | null>(null);

    const handleNotification = (action: string) => {
        switch (true) {
            case action.includes(Actions.Highlight):
                setSelectedStudentId(+action.split(':')[1]);
            case action.includes(Actions.Update):
                getMeetings(id).then(response => setMeeting(response.data[0]));
        }
    }

    useEffect(() => {
        if (id) {
            getMeetings(id).then(response => setMeeting(response.data[0]));

            signalRService.current = new SignalRService(id, handleNotification);
            signalRService.current.startConnection();
            signalRService.current.sendNotification(Actions.Join);
        }

        return () => {
            if (signalRService.current) signalRService.current.stopConnection();
            signalRService.current = null;
        }
    }, [id]);

    const handleRowClick = (workId: number) => {
        navigate(`/meetings/${id}/studentwork/${workId}`, {replace: true});
    };

    return (
        <>
            <div className="d-flex flex-column p-2">
                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Дата и время</label>
                    <span className="form-control-plaintext w-auto text-wrap">{formatDate(meeting.dateAndTime)}</span>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Аудитория</label>
                    <span className="form-control-plaintext w-auto text-wrap">{meeting.auditorium || "—"}</span>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Информация о
                        заседании</label>
                    <span className="form-control-plaintext w-auto text-wrap">{meeting.info}</span>
                </div>

                {meeting.callLink && (
                    <div className="d-flex mb-2 align-items-center">
                        <label className="me-3 fw-bold text-end label-custom">Ссылка на созвон</label>
                        <a href={meeting.callLink}
                           className="form-control-plaintext text-primary text-decoration-underline w-auto"
                           target="_blank"
                           rel="noopener noreferrer">
                            {meeting.callLink}
                        </a>
                    </div>
                )}

                {meeting.materialsLink && (
                    <div className="d-flex mb-2 align-items-center">
                        <label className="me-3 fw-bold text-end label-custom">Ссылка на материалы</label>
                        <a href={meeting.materialsLink}
                           className="form-control-plaintext text-primary text-decoration-underline w-auto"
                           target="_blank"
                           rel="noopener noreferrer">
                            {meeting.materialsLink}
                        </a>
                    </div>
                )}
            </div>

            <hr className="my-4"/>

            <div>
                <div className="d-flex p-2 align-items-center">
                    <h4>Список защищающихся студентов</h4>
                </div>
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                        <tr>
                            <th>ФИО</th>
                            <th>Тема</th>
                            <th>Научник</th>
                            <th>Консультант</th>
                            <th>Рецензент</th>
                            <th>Оценка научника</th>
                            <th>Оценка рецезента</th>
                            <th>Код</th>
                        </tr>
                        </thead>
                        <tbody>
                        {meeting.studentWorks.map((work) => (
                            <tr key={work.id} onClick={() => handleRowClick(work.id)}
                                className={selectedStudentId === work.id ? "table-info" : ""}
                                style={{cursor: "pointer"}}>
                                <td>{work.studentName}</td>
                                <td style={{maxWidth: '600px'}}>{work.theme}</td>
                                <td>{work.supervisor}</td>
                                <td>{work.consultant || "—"}</td>
                                <td>{work.reviewer || "—"}</td>
                                <td>{work.supervisorMark || "—"}</td>
                                <td>{work.reviewerMark || "—"}</td>
                                <td style={{minWidth: '85px'}}>{work.codeLink ? (
                                    <a href={work.codeLink} target="_blank" rel="noopener noreferrer">
                                        Ссылка
                                    </a>
                                ) : (
                                    <span>—</span>
                                )}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

