import React, {useEffect, useState, useRef} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {getMeetings, getCriteria, setFinalMark} from '../services/ApiService';
import 'react-datepicker/dist/react-datepicker.css';
import {formatDate} from './MeetingsPage';
import {SignalRService} from '../services/SignalRService';
import {Actions} from '../models/Actions';

export function MemberPage() {
    const {id} = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("works");
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
    const [marks, setMarks] = useState([]);

    const signalRService = useRef<SignalRService | null>(null);

    const fetchData = () => {
        getMeetings(id).then(response => {
            const meeting = response.data[0]
            setMeeting(meeting);

            setMarks(
                meeting.studentWorks.map(work => {
                    const mark = Math.round(work.averageCriteriaMarks.reduce((sum, mark) =>
                        sum + mark.averageMark, 0) / work.averageCriteriaMarks.length * 10) / 10;

                    return {
                        id: work.id,
                        averageMark: mark,
                        finalMark: work.finalMark === null ? Math.round(mark) : work.finalMark
                    };
                })
            );
        });
    }

    const handleNotification = (action: string) => {
        switch (true) {
            case action.includes(Actions.Highlight):
                setSelectedStudentId(+action.split(':')[1]);
                break;
            case action.includes(Actions.Update) || action.includes(Actions.SendMark):
                fetchData();
                break;
        }
    }

    useEffect(() => {
        if (id) {
            fetchData();

            signalRService.current = new SignalRService(id, handleNotification);
            signalRService.current.startConnection();
            signalRService.current.sendNotification(Actions.Join);
        }

        return () => {
            if (signalRService.current) signalRService.current.stopConnection();
            signalRService.current = null;
        }
    }, [id]);

    const handleIconClick = (workId: number) => {
        navigate(`/meetings/${id}/studentwork/${workId}`, {replace: true});
    };

    const handleMarkEdit = (e, id) => {
        const value = e.target.value;
        
        setMarks(marks.map(mark => mark.id === id ? {
            ...mark,
            finalMark: value
        } : mark));

        if (value) setFinalMark(meeting.id, id, +value);
    }

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
                <div className="d-flex p-2 mb-2 align-items-center">
                    <h4>Список защищающихся студентов</h4>
                </div>
            </div>

            <ul className="nav nav-tabs" role="tablist">
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === "works" ? "active" : ""}`}
                        onClick={() => setActiveTab("works")}
                        type="button"
                        role="tab">Работы студентов
                    </button>
                </li>
                <li className="nav-item" role="presentation">
                    <button
                        className={`nav-link ${activeTab === "marks" ? "active" : ""}`}
                        onClick={() => setActiveTab("marks")}
                        type="button"
                        role="tab">Средние оценки
                    </button>
                </li>
            </ul>

            <div className="tab-content">
                {activeTab === "works" && (
                    <div className="tab-pane fade show active">
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
                                    <tr key={work.id}
                                        className={selectedStudentId === work.id ? "table-info" : ""}>
                                        <td style={{width: '30px'}}>
                                            <button type="button" className="btn btn-sm btn-link" onClick={(e) => {
                                                e.stopPropagation();
                                                handleIconClick(work.id);
                                            }}>
                                                <i className="bi bi-arrows-angle-expand fs-5"
                                                   style={{color: '#007bff'}}></i>
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
                    </div>
                )}

                {activeTab === "marks" && (
                    <div className="tab-pane fade show active">
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                <tr>
                                    <th></th>
                                    <th>ФИО</th>
                                    {meeting.criteria.map((criteria) => (
                                        <th key={criteria.id}>{criteria.name}</th>
                                    ))}
                                    <th>Средняя оценка</th>
                                    <th>Итоговая оценка</th>
                                </tr>
                                </thead>
                                <tbody>
                                {meeting.studentWorks.map((work) => (
                                    <tr key={work.id}
                                        className={selectedStudentId === work.id ? "table-info" : ""}>
                                        <td style={{width: '30px'}}>
                                            <button type="button" className="btn btn-sm btn-link" onClick={(e) => {
                                                e.stopPropagation();
                                                handleIconClick(work.id);
                                            }}>
                                                <i className="bi bi-arrows-angle-expand fs-5"
                                                   style={{color: '#007bff'}}></i>
                                            </button>
                                        </td>
                                        <td>{work.studentName}</td>
                                        {work.averageCriteriaMarks.map((mark) => (
                                            <td key={mark.criteriaId} className="text-center">{mark.averageMark || "—"}</td>
                                        ))}
                                        <td className="text-center">{marks.find(mark => mark.id === work.id).averageMark || "—"}</td>
                                        <td>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={marks.find(mark => mark.id === work.id).finalMark || ""}
                                                onChange={(e) =>handleMarkEdit(e, work.id)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

