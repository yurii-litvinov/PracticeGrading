import React, {useEffect, useState, useRef} from 'react';
import {useNavigate, useParams, useLocation} from 'react-router-dom';
import DatePicker, {registerLocale} from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ru from 'date-fns/locale/ru';
import {StudentWorkModal} from '../components/StudentWorkModal';
import {createMeeting, getCriteria, getMeetings, updateMeeting} from '../services/ApiService';
import {SignalRService} from '../services/SignalRService';
import {Actions} from '../models/Actions';

registerLocale('ru', ru);

export function MeetingFormPage() {
    const {id} = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [workToEditIndex, setWorkToEditIndex] = useState();
    const [criteria, setCriteria] = useState([]);
    const redirectTo = location.state?.redirectTo || "default";

    const signalRService = useRef<SignalRService | null>(null);

    const [meeting, setMeeting] = useState({
        id: null,
        dateAndTime: new Date(),
        auditorium: '',
        info: '',
        callLink: '',
        materialsLink: '',
        studentWorks: [],
        members: [''],
        criteriaId: []
    });

    const handleNotification = (message: string) => {
        console.log(message);
    }

    useEffect(() => {
        if (id) {
            getMeetings(id).then(response => setMeeting(response.data[0]));

            signalRService.current = new SignalRService(id, handleNotification);
            signalRService.current.startConnection();

            getCriteria().then(response => setCriteria(response.data));
        }

        return () => {
            if (signalRService.current) signalRService.current.stopConnection();
            signalRService.current = null;
        }
    }, [id]);

    const handleBack = () => {
        if (redirectTo === 'view') {
            navigate(`/meetings/${id}`, {replace: true});
        } else if (redirectTo === 'running') {
            navigate(`/meetings/running/${id}`, {replace: true});
        } else {
            navigate("/meetings", {replace: true});
        }
    }

    const handleMeetingChange = (e) => {
        const {name, value} = e.target;

        setMeeting((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    const addOrUpdateStudentWork = (work) => {
        if (workToEditIndex !== null) {
            setMeeting((prevMeeting) => ({
                ...prevMeeting,
                studentWorks: prevMeeting.studentWorks.map((prevWork, index) =>
                    index === workToEditIndex ? work : prevWork
                ),
            }));
        } else {
            setMeeting((prevMeeting) => ({
                ...prevMeeting,
                studentWorks: [...prevMeeting.studentWorks, work],
            }));
        }

        setWorkToEditIndex(null);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (redirectTo === 'view' || redirectTo === 'running') {
            const response = await updateMeeting(meeting);

            if (response.status === 200) {
                await signalRService.current.sendNotification(Actions.Update);
                redirectTo === 'view' ? navigate(`/meetings/${id}`, {replace: true})
                    : navigate(`/meetings/running/${id}`, {replace: true});
            }
        } else {
            const response = await createMeeting(meeting);

            if (response.status === 200) {
                navigate("/meetings", {replace: true});
            }
        }
    }

    useEffect(() => {
        if (meeting.members[meeting.members.length - 1] !== '') {
            setMeeting((prevMeeting) => ({
                ...prevMeeting,
                members: [...prevMeeting.members, '']
            }))
        }
    }, [meeting.members]);

    const handleMemberChange = (index: number, value: string) => {
        const updatedMembers = [...meeting.members];
        updatedMembers[index] = value;

        if (value === '') {
            updatedMembers.splice(index, 1);
        }

        setMeeting((prevMeeting) => ({
            ...prevMeeting,
            members: updatedMembers
        }));
    }

    const handleStudentWorkDelete = (index: number) => {
        setMeeting((prevMeeting) => ({
            ...prevMeeting,
            studentWorks: prevMeeting.studentWorks.filter((_, i) => i !== index)
        }));
    }

    const handleCriteriaChange = (e) => {
        setMeeting(prevMeeting => {
            let updatedCriteriaId = [...prevMeeting.criteriaId];

            if (e.target.checked) {
                if (!updatedCriteriaId.includes(Number(e.target.id))) {
                    updatedCriteriaId.push(Number(e.target.id));
                }
            } else {
                updatedCriteriaId = updatedCriteriaId.filter(id => id !== Number(e.target.id));
            }

            return {
                ...prevMeeting,
                criteriaId: updatedCriteriaId,
            }
        })

    }

    return (
        <>
            <form onSubmit={handleSubmit}>
                <div className="d-flex flex-column flex-sm-row align-items-start justify-content-end w-100">
                    <h2 className="me-auto w-100 mb-3 mb-sm-0 text-center text-sm-start">
                        {id ? "Редактирование заседания" : "Новое заседание"}</h2>
                    <div className="d-flex flex-column flex-sm-row justify-content-end w-100">
                        <button type="submit" className="btn btn-primary btn-lg mb-2 mb-sm-0 me-sm-2" id="save-meeting"
                                disabled={meeting.studentWorks.length === 0}>Сохранить
                        </button>
                        <button type="button" className="btn btn-light btn-lg mb-2 mb-sm-0 me-sm-2"
                                onClick={handleBack}>Назад
                        </button>
                    </div>
                </div>

                <div className="d-flex flex-column p-4">
                    <div className="d-flex mb-2 align-items-center flex-wrap">
                        <label className="me-3 fw-bold text-end label-custom">Дата и время</label>
                        <div className="custom-datepicker">
                            <DatePicker
                                selected={new Date(meeting.dateAndTime)}
                                onChange={(date) => setMeeting({...meeting, dateAndTime: new Date(date)})}
                                dateFormat="d MMMM yyyy, HH:mm"
                                showTimeSelect
                                timeIntervals={60}
                                timeCaption=""
                                timeFormat="HH:mm"
                                locale="ru"/>
                        </div>
                    </div>

                    <div className="d-flex mb-2 align-items-center flex-wrap">
                        <label className="me-3 fw-bold text-end label-custom">Аудитория</label>
                        <input
                            style={{maxWidth: '60em'}}
                            type="text"
                            className="form-control"
                            name="auditorium"
                            value={meeting.auditorium}
                            onChange={handleMeetingChange}
                            placeholder="3381"/>
                    </div>

                    <div className="d-flex mb-2 align-items-center flex-wrap">
                        <label className="me-3 fw-bold text-end label-custom">Информация о
                            заседании</label>
                        <input
                            style={{maxWidth: '60em'}}
                            type="text"
                            className="form-control"
                            value={meeting.info}
                            name="info"
                            required
                            onChange={handleMeetingChange}
                            placeholder="СП, бакалавры ПИ, ГЭК 5080-01"/>
                    </div>

                    <div className="d-flex mb-2 align-items-center flex-wrap">
                        <label className="me-3 fw-bold text-end label-custom">Ссылка на созвон</label>
                        <input
                            style={{maxWidth: '60em'}}
                            type="url"
                            className="form-control"
                            value={meeting.callLink}
                            name="callLink"
                            onChange={handleMeetingChange}
                            placeholder="https://..."/>
                    </div>

                    <div className="d-flex align-items-center flex-wrap">
                        <label className="me-3 fw-bold text-end label-custom">Ссылка на материалы</label>
                        <input
                            style={{maxWidth: '60em'}}
                            type="url"
                            className="form-control"
                            value={meeting.materialsLink}
                            name="materialsLink"
                            onChange={handleMeetingChange}
                            placeholder="https://..."/>
                    </div>
                </div>

                <hr className="my-4"/>

                <div>
                    <div className="d-flex p-2 align-items-center">
                        <h4>Список защищающихся студентов</h4>
                        <button type="button" className="btn btn-outline-primary ms-auto" data-bs-toggle="modal"
                                data-bs-target="#studentWorkModal" id="add-student"
                                onClick={() => setWorkToEditIndex(null)}>
                            Добавить студента
                        </button>
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
                            {meeting.studentWorks.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center">Добавьте работы студентов</td>
                                </tr>
                            ) : (
                                meeting.studentWorks.map((work, index) => (
                                    <tr key={index}>
                                        <td style={{minWidth: '95px'}}>
                                            <button type="button" className="btn btn-sm"
                                                    onClick={() => handleStudentWorkDelete(index)}>
                                                <i className="bi bi-x-lg fs-5" style={{color: 'red'}}></i>
                                            </button>
                                            <button type="button" className="btn btn-sm"
                                                    data-bs-toggle="modal" data-bs-target="#studentWorkModal"
                                                    onClick={() => setWorkToEditIndex(index)}>
                                                <i className="bi bi-pencil fs-5" style={{color: '#007bff'}}></i>
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
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    <hr className="my-4"/>

                    <div className="d-flex flex-wrap">
                        <div className="flex-grow-1 pe-4 mb-3">
                            <h4 className="p-2">Список членов комиссии</h4>
                            {meeting.members.map((member, index) => (
                                <div key={index} className="pt-3 px-3">
                                    <input
                                        type="text"
                                        style={{minWidth: '15em'}}
                                        className="form-control"
                                        value={member}
                                        id="member"
                                        onChange={(e) => handleMemberChange(index, e.target.value)}
                                        placeholder="Иванов Иван Иванович"/>
                                </div>
                            ))}
                        </div>

                        <div className="flex-grow-1">
                            <h4 className="p-2">Критерии</h4>
                            <ul className="list-group p-2">
                                {criteria.map((criteria) => (
                                    <li className="list-group-item d-flex align-items-center" key={criteria.id}>
                                        <input className="form-check-input me-3" type="checkbox"
                                               checked={meeting.criteriaId.includes(criteria.id)}
                                               id={criteria.id} onChange={(e) => handleCriteriaChange(e)}/>
                                        <label className="form-check-label stretched-link"
                                               htmlFor={criteria.id}> {criteria.name}{criteria.comment && (
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
            </form>

            <StudentWorkModal
                studentWorkData={meeting.studentWorks[workToEditIndex]}
                onSave={addOrUpdateStudentWork}/>
        </>
    );
}

