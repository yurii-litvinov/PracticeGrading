import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {getMeetings, getCriteria} from '../services/apiService';
import 'react-datepicker/dist/react-datepicker.css';
import {formatDate} from './MeetingsPage';

export function ViewMeetingPage() {
    const {id} = useParams();
    const navigate = useNavigate();
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

    useEffect(() => {
        getMeetings(id).then(response => setMeeting(response.data[0]));
    }, [id]);

    useEffect(() => {
        if (meeting.criteriaId.length === 0 || criteria.length === meeting.criteriaId.length) {
            return;
        }
        const criteriaPromises = meeting.criteriaId.map(criteriaId =>
            getCriteria(criteriaId).then(response => response.data[0])
        );

        Promise.all(criteriaPromises).then(criteriaData => {
            setCriteria(criteriaData);
        });
    }, [meeting.criteriaId]);

    const handleBack = () => {
        navigate("/meetings", {replace: true})
    }

    const handleEditMeeting = () => {
        navigate(`/meetings/edit/${id}`, {replace: true})
    }

    return (
        <>
            <div className="d-flex align-items-center justify-content-end">
                <h2 className="me-auto">Просмотр заседания</h2>
                <button type="button" className="btn btn-primary btn-lg me-2"
                        onClick={handleEditMeeting}>Редактировать
                </button>
                <button type="button" className="btn btn-light btn-lg me-2" onClick={handleBack}>Назад</button>
            </div>

            <div className="d-flex flex-column p-4">
                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end" style={{minWidth: '225px'}}>Дата и время</label>
                    <input type="text" readOnly className="form-control-plaintext"
                           value={formatDate(meeting.dateAndTime)}/>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end" style={{minWidth: '225px'}}>Аудитория</label>
                    <input type="text" readOnly className="form-control-plaintext"
                           value={meeting.auditorium || "—"}/>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end" style={{minWidth: '225px'}}>Информация о
                        заседании</label>
                    <input type="text" readOnly className="form-control-plaintext"
                           value={meeting.info}/>
                </div>
                
                {meeting.callLink && (
                    <div className="d-flex mb-2 align-items-center">
                        <label className="me-3 fw-bold text-end" style={{minWidth: '225px'}}>Ссылка на созвон</label>
                        <a href={meeting.callLink} className="form-control-plaintext" target="_blank"
                           rel="noopener noreferrer">
                            {meeting.callLink}
                        </a>
                    </div>
                )}

                {meeting.materialsLink && (
                    <div className="d-flex mb-2 align-items-center">
                        <label className="me-3 fw-bold text-end" style={{minWidth: '225px'}}>Ссылка на материалы</label>
                        <a href={meeting.materialsLink} className="form-control-plaintext" target="_blank"
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
                        {meeting.studentWorks.map((work, index) => (
                            <tr key={index}>
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

                <div className="d-flex">
                    <div className="flex-grow-1 pe-4" style={{minWidth: '400px'}}>
                        <h4 className="p-2">Список членов комиссии</h4>
                        {meeting.members.map((member, index) => (
                            <div key={index} className="pt-3 px-3">
                                <input type="text" readOnly className="form-control-plaintext"
                                       value={member}/>
                            </div>
                        ))}
                    </div>

                    <div className="flex-grow-1">
                        <h4 className="p-2">Критерии</h4>
                        <ul className="list-group p-2">
                            {criteria.map((criteria) => (
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

