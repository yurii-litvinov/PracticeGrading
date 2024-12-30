import React, {useEffect, useState, useRef} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {getMeetings, getCriteria} from '../services/ApiService';
import 'react-datepicker/dist/react-datepicker.css';
import {formatDate} from './MeetingsPage';
import {SignalRService} from '../services/SignalRService';
import {Actions} from '../models/Actions';
import Tooltip from 'bootstrap/js/dist/tooltip.js';

export function ViewMeetingPage() {
    const {id} = useParams();
    const navigate = useNavigate();
    const [selectedStudentId, setSelectedStudentId] = useState(null);
    const [meeting, setMeeting] = useState({
        dateAndTime: new Date(),
        auditorium: '',
        info: '',
        callLink: '',
        materialsLink: '',
        studentWorks: [],
        members: [],
        criteria: []
    });

    const signalRService = useRef<SignalRService | null>(null);
    const tooltipRef = useRef(null);

    const handleNotification = (action: string) => {
        console.log(action)
        switch (true) {
            case action.includes(Actions.Join):
                getMeetings(id).then(response => setMeeting(response.data[0]));
                signalRService.current.sendNotification(`${Actions.Highlight}:${selectedStudentId}`);
        }
    }
    
    useEffect(() => {
        const tooltipElement = document.getElementById('copy');
        tooltipRef.current = new Tooltip(tooltipElement);

        if (id) {
            getMeetings(id).then(response => setMeeting(response.data[0]));

            signalRService.current = new SignalRService(id, handleNotification);
            signalRService.current.startConnection();
        }

        return () => {
            if (signalRService.current) signalRService.current.stopConnection();
            signalRService.current = null;
            if (tooltipRef.current) {
                tooltipRef.current.dispose();  
            }
        }
    }, [id]);

    const handleBack = () => {
        navigate("/meetings", {replace: true})
    }

    const handleEditMeeting = () => {
        navigate(`/meetings/edit/${id}`, {replace: true});
    }

    const handleRowClick = (id: number) => {
        setSelectedStudentId(id === selectedStudentId ? null : id);
        signalRService.current.sendNotification(`${Actions.Highlight}:${id === selectedStudentId ? null : id}`);
    };

    const handleIconClick = (workId: number) => {
        navigate(`/meetings/${id}/studentwork/${workId}`, {replace: true});
    };

    return (
        <>
            <div className="d-flex flex-column flex-sm-row align-items-start justify-content-end w-100">
                <h2 className="me-auto w-100 mb-3 mb-sm-0 text-center text-sm-start">Просмотр заседания</h2>
                <div className="d-flex flex-column flex-sm-row justify-content-end w-100">
                    <button type="button" className="btn btn-outline-primary btn-lg mb-2 mb-sm-0 me-sm-2"
                            onClick={handleEditMeeting}>Редактировать
                    </button>
                    <button type="button" className="btn btn-light btn-lg mb-2 mb-sm-0 me-sm-2"
                            onClick={handleBack}>Назад
                    </button>
                </div>
            </div>

            <div className="d-flex flex-column p-2">
                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Ссылка для членов
                        комиссии</label>
                    <a href="#" id="copy" data-bs-custom-class="tooltip-light" data-bs-toggle="tooltip" data-bs-trigger="hover" data-bs-placement="top" title="Копировать ссылку"
                       className="icon-link icon-link-hover form-control-plaintext text-primary text-decoration-underline w-auto"
                       style={{'--bs-icon-link-transform': 'translate3d(0, -.125rem, 0)'}}
                       onClick={(e) => {
                           e.preventDefault();
                           navigator.clipboard.writeText(`${window.location.origin}/meetings/${id}/member`)
                               .then(() => {
                                   tooltipRef.current.dispose();
                                   
                                   const tooltipElement = document.getElementById('copy');
                                   tooltipElement.setAttribute('title', 'Скопировано!');
                                   tooltipRef.current = new Tooltip(tooltipElement);
                                   tooltipRef.current.show();

                                   setTimeout(() => {
                                       tooltipRef.current.dispose();
                                       const tooltipElement = document.getElementById('copy');
                                       tooltipElement.setAttribute('title', 'Копировать ссылку');
                                       tooltipRef.current = new Tooltip(tooltipElement);
                                   }, 700);

                               });
                       }}>
                        {`${window.location.origin}/meetings/${id}/member`}
                        <i className="bi bi-clipboard mb-2"/>
                    </a>
                </div>

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
                            <th></th>
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
                                <td style={{width: '30px'}}>
                                    <button type="button" className="btn btn-sm btn-link" onClick={(e) => {
                                        e.stopPropagation();
                                        handleIconClick(work.id);
                                    }}>
                                        <i className="bi bi-arrows-angle-expand fs-5" style={{color: '#007bff'}}></i>
                                    </button>
                                </td>
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

                <hr className="my-4"/>

                <div className="d-flex flex-wrap">
                    <div className="flex-grow-1 pe-4 mb-2" style={{minWidth: '20em'}}>
                        <h4 className="p-2">Список членов комиссии</h4>
                        {meeting.members.map((member, index) => (
                            <div key={index} className=" px-3">
                                <input type="text" readOnly className="form-control-plaintext"
                                       value={member.name}/>
                            </div>
                        ))}
                    </div>

                    <div className="flex-grow-1">
                        <h4 className="p-2">Критерии</h4>
                        <ul className="list-group p-2">
                            {meeting.criteria.map((criteria) => (
                                <li className="list-group-item d-flex align-items-center" key={criteria.id}>
                                    <label> {criteria.name}{criteria.comment && (
                                        <>
                                            <br/>
                                            <small className=""
                                                   style={{color: '#9a9d9f'}}>{criteria.comment}</small>
                                        </>
                                    )}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </>
    );
}

