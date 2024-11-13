import React, {useEffect, useState, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {getMeetings} from '../services/apiService';
import DatePicker, {registerLocale} from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ru from 'date-fns/locale/ru';
import {Meeting} from '../interfaces/Meeting'
import {StudentWorkModal} from '../components/StudentWorkModal';
import {createMeeting} from '../services/apiService';

registerLocale('ru', ru);

export function CreateMeetingPage() {
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState();
    const [workToEditIndex, setWorkToEditIndex] = useState();

    const [meeting, setMeeting] = useState({
        dateAndTime: new Date(),
        auditorium: '',
        info: '',
        callLink: '',
        materialsLink: '',
        studentWorks: [],
        members: ['']
    });

    const handleBack = () => {
        navigate("/meetings", {replace: true})
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
        const responce = await createMeeting(meeting);

        if (responce.status === 200) {
            navigate("/meetings", {replace: true})
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

    return (
        <>
            <form onSubmit={handleSubmit}>
                <div className="d-flex align-items-center justify-content-end">
                    <h2 className="me-auto">Новое заседание</h2>
                    <button type="submit" className="btn btn-primary btn-lg me-2"
                            disabled={meeting.studentWorks.length === 0}>Сохранить
                    </button>
                    <button type="button" className="btn btn-light btn-lg me-2" onClick={handleBack}>Назад</button>
                </div>

                <div className="d-flex flex-column p-4">
                    <div className="d-flex mb-2 align-items-center">
                        <label className="me-3 fw-bold text-end" style={{minWidth: '225px'}}>Дата и время</label>
                        <div className="custom-datepicker">
                            <DatePicker
                                selected={meeting.dateAndTime}
                                onChange={(date) => setMeeting({...meeting, dateAndTime: new Date(date)})}
                                dateFormat="d MMMM yyyy, HH:mm"
                                showTimeSelect
                                timeIntervals={60}
                                timeCaption=""
                                timeFormat="HH:mm"
                                locale="ru"/>
                        </div>
                    </div>

                    <div className="d-flex mb-2 align-items-center">
                        <label className="me-3 fw-bold text-end" style={{minWidth: '225px'}}>Аудитория</label>
                        <input
                            type="text"
                            className="form-control"
                            name="auditorium"
                            value={meeting.auditorium}
                            onChange={handleMeetingChange}
                            required
                            placeholder="3381"/>
                    </div>

                    <div className="d-flex mb-2 align-items-center">
                        <label className="me-3 fw-bold text-end" style={{minWidth: '225px'}}>Информация о
                            заседании</label>
                        <input
                            type="text"
                            className="form-control"
                            value={meeting.info}
                            name="info"
                            onChange={handleMeetingChange}
                            required
                            placeholder="СП, бакалавры ПИ, ГЭК 5080-01"/>
                    </div>

                    <div className="d-flex mb-2 align-items-center">
                        <label className="me-3 fw-bold text-end" style={{minWidth: '225px'}}>Ссылка на созвон</label>
                        <input
                            type="url"
                            className="form-control"
                            value={meeting.callLink}
                            name="callLink"
                            onChange={handleMeetingChange}
                            required
                            placeholder="https://..."/>
                    </div>

                    <div className="d-flex align-items-center">
                        <label className="me-3 fw-bold text-end" style={{minWidth: '225px'}}>Ссылка на материалы</label>
                        <input
                            type="url"
                            className="form-control"
                            value={meeting.materialsLink}
                            name="materialsLink"
                            onChange={handleMeetingChange}
                            required
                            placeholder="https://..."/>
                    </div>
                </div>

                <hr className="my-4"/>

                <div>
                    <div className="d-flex p-2 align-items-center">
                        <h4>Список защищающихся студентов</h4>
                        <button type="button" className="btn btn-outline-primary ms-auto" data-bs-toggle="modal"
                                data-bs-target="#staticBackdrop" onClick={() => setWorkToEditIndex(null)}>
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
                                        <td style={{ minWidth: '95px' }}>
                                            <button type="button" className="btn btn-outline-none btn-sm"
                                                    onClick={() => handleStudentWorkDelete(index)}>
                                                <i className="bi bi-x-lg fs-5" style={{color: 'red'}}></i>
                                            </button>
                                            <button type="button" className="btn btn-outline-none  btn-sm"
                                                    data-bs-toggle="modal" data-bs-target="#staticBackdrop"
                                                    onClick={() => setWorkToEditIndex(index)}>
                                                <i className="bi bi-pencil fs-5" style={{color: '#007bff'}}></i>
                                            </button>
                                        </td>
                                        <td>{work.studentName}</td>
                                        <td style={{ maxWidth: '600px'}}>{work.theme}</td>
                                        <td>{work.supervisor}</td>
                                        <td>{work.consultant || "—"}</td>
                                        <td>{work.reviewer}</td>
                                        <td>{work.supervisorMark}</td>
                                        <td>{work.reviewerMark}</td>
                                        <td style={{ minWidth: '85px' }}>{work.codeLink ? (
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

                    <div>
                        <h4 className="p-2">Список членов комиссии</h4>
                        {meeting.members.map((member, index) => (
                            <div key={index} className="pt-3 px-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={member}
                                    onChange={(e) => handleMemberChange(index, e.target.value)}
                                    placeholder="Иванов Иван Иванович"/>
                            </div>
                        ))}
                    </div>
                </div>
            </form>
            
            <StudentWorkModal
                studentWorkData={meeting.studentWorks[workToEditIndex]}
                onSave={addOrUpdateStudentWork}/>
        </>
    );
}

