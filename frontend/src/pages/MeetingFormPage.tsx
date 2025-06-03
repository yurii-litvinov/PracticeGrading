import React, {useEffect, useState, useRef} from 'react';
import {useParams} from 'react-router-dom';
import DatePicker, {registerLocale} from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {ru} from 'date-fns/locale/ru';
import {StudentWorkModal} from '../components/StudentWorkModal';
import {createMeeting, getCriteriaGroup, getMeetings, updateMeeting} from '../services/ApiService';
import {SignalRService} from '../services/SignalRService';
import {Actions} from '../models/Actions';
import {StudentWork} from '../models/StudentWork';
import {Meeting} from '../models/Meeting';
import {CriteriaGroup} from '../models/CriteriaGroup';

registerLocale('ru', ru);

export function MeetingFormPage() {
    const {id} = useParams();
    const [workToEditIndex, setWorkToEditIndex] = useState<number | null>();
    const [criteriaGroups, setCriteriaGroups] = useState<CriteriaGroup[]>();
    const signalRService = useRef<SignalRService | null>(null);

    const [meeting, setMeeting] = useState<Meeting>({
        id: undefined,
        dateAndTime: new Date(),
        auditorium: '',
        info: '',
        callLink: '',
        materialsLink: '',
        studentWorks: [],
        members: [{id: undefined, name: ''}],
        criteriaGroup: undefined
    });

    const handleNotification = (message: string) => {
        console.log(message);
    }

    useEffect(() => {
        if (id) {
            getMeetings(Number(id)).then(response => setMeeting(response.data[0]));

            signalRService.current = new SignalRService(id, handleNotification);
            signalRService.current.startConnection();
        }

        getCriteriaGroup().then(response => setCriteriaGroups(response.data));

        return () => {
            if (signalRService.current) signalRService.current.stopConnection();
            signalRService.current = null;
        }
    }, [id]);

    const handleBack = () => {
        window.history.back();
    }

    const handleMeetingChange = (e: { target: { name: any; value: any; }; }) => {
        const {name, value} = e.target;

        setMeeting((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    const addOrUpdateStudentWork = (work: StudentWork) => {
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

        if (id) {
            const response = await updateMeeting(meeting);

            if (response.status === 200) {
                await signalRService.current?.sendNotification(Actions.Update);
                window.history.back();
            }
        } else {
            const response = await createMeeting(meeting);

            if (response.status === 200) {
                window.history.back();
            }
        }
    }

    useEffect(() => {
        if (meeting.members.length === 0 || meeting.members[meeting.members.length - 1].name !== '') {
            setMeeting((prevMeeting) => ({
                ...prevMeeting,
                members: [...prevMeeting.members, {id: undefined, name: ''}]
            }))
        }
    }, [meeting.members]);

    const handleMemberChange = (index: number, value: string) => {
        const updatedMembers = [...meeting.members];
        updatedMembers[index].name = value;

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

    useEffect(() => {
        const handleBeforeUnload = (event: { preventDefault: () => void; returnValue: string; }) => {
            event.preventDefault();
            event.returnValue = "";
        }

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    });

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
                                onChange={(date) => date && setMeeting({...meeting, dateAndTime: new Date(date)})}
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
                                {meeting.studentWorks.some((work) => work.info) ?
                                    (<th>Курс, направление</th>) : (<></>)}
                                <th>Тема</th>
                                <th>Научник</th>
                                {meeting.studentWorks.some((work) => work.consultant) ? (
                                    <th>Консультант</th>) : (<></>)}
                                {meeting.studentWorks.some((work) => work.reviewer) ? (<th>Рецензент</th>) : (<></>)}
                                <th>Оценка научника</th>
                                {meeting.studentWorks.some((work) => work.reviewerMark) ?
                                    (<th>Оценка рецезента</th>) : (<></>)}
                                {meeting.studentWorks.some((work) => work.codeLink) ?
                                    (<th>Код</th>) : (<></>)}
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
                                            <button type="button" className="btn btn-sm btn-link"
                                                    onClick={() => handleStudentWorkDelete(index)}>
                                                <i className="bi bi-x-lg fs-5" style={{color: '#dc3545'}}></i>
                                            </button>
                                            <button type="button" className="btn btn-sm btn-link"
                                                    data-bs-toggle="modal" data-bs-target="#studentWorkModal"
                                                    onClick={() => setWorkToEditIndex(index)}>
                                                <i className="bi bi-pencil fs-5" style={{color: '#007bff'}}></i>
                                            </button>
                                        </td>
                                        <td>{work.studentName}</td>
                                        {meeting.studentWorks.some((work) => work.info) ?
                                            (<td>{work.info || "—"}</td>) : (<></>)}
                                        <td style={{maxWidth: '600px'}}>{work.theme}</td>
                                        <td>{work.supervisor}</td>
                                        {meeting.studentWorks.some((work) => work.consultant) ? (
                                            <td>{work.consultant || "—"}</td>) : (<></>)}
                                        {meeting.studentWorks.some((work) => work.reviewer) ?
                                            (<td>{work.reviewer || "—"}</td>) : (<></>)}
                                        <td>{work.supervisorMark || "—"}</td>
                                        {meeting.studentWorks.some((work) => work.reviewerMark) ?
                                            (<td>{work.reviewerMark || "—"}</td>) : (<></>)}
                                        {meeting.studentWorks.some((work) => work.codeLink) ?
                                            (<td style={{minWidth: '87px'}}>{work.codeLink ? (
                                                work.codeLink !== 'NDA' ? (
                                                    work.codeLink.split(' ').map((link, linkIndex) => (
                                                        <div key={linkIndex} className="mb-2">
                                                            <a href={link} target="_blank" rel="noopener noreferrer">
                                                                Ссылка {work.codeLink && work.codeLink.split(' ').length > 1 ? linkIndex + 1 : ''}
                                                            </a>
                                                        </div>
                                                    ))
                                                ) : (<span className="fst-italic">NDA</span>)
                                            ) : (
                                                <span>—</span>
                                            )}</td>) : (<></>)}
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
                                        value={member.name}
                                        id="member"
                                        onChange={(e) => handleMemberChange(index, e.target.value)}
                                        placeholder="Иванов Иван Иванович"/>
                                </div>
                            ))}
                        </div>

                        <div className="flex-grow-1">
                            <h4 className="p-2">Группа критериев</h4>
                            <ul className="list-group p-2">
                                {criteriaGroups?.map((group, index) => (
                                    <li className="list-group-item d-flex align-items-center" key={group.id}>
                                        <input className="form-check-input me-3" type="radio"
                                               name={`criteria-${index}`}
                                               checked={meeting.criteriaGroup?.id === group.id}
                                               id={String(group.id)}
                                               onChange={() => setMeeting({...meeting, criteriaGroup: group})}/>
                                        <label className="form-check-label stretched-link"
                                               htmlFor={String(group.id)}> {group.name}
                                        </label>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </form>

            <StudentWorkModal
                studentWorkData={workToEditIndex != null ? meeting.studentWorks[workToEditIndex] : undefined}
                onSave={addOrUpdateStudentWork}/>
        </>
    );
}

