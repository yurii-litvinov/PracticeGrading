import {useEffect, useState, useRef, ChangeEvent} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {getMeetings, setFinalMark, getCriteriaGroup} from '../services/ApiService';
import 'react-datepicker/dist/react-datepicker.css';
import {formatDate} from './MeetingsPage';
import {SignalRService} from '../services/SignalRService';
import {Actions} from '../models/Actions';
import {Meeting} from '../models/Meeting';
import {CriteriaGroup} from '../models/CriteriaGroup';
import {StudentWork} from '../models/StudentWork';
import {MetricTypes} from '../models/MetricTypes'
import {calculateFinalMark} from "./ViewMeetingPage"

export function MemberPage() {
    const {id} = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("works");
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [meeting, setMeeting] = useState<Meeting>({
        id: undefined,
        dateAndTime: new Date(),
        auditorium: '',
        info: '',
        callLink: '',
        materialsLink: '',
        studentWorks: [],
        members: [],
        criteriaGroup: undefined
    });
    const [marks, setMarks] = useState<any[]>([]);
    const [criteriaGroup, setCriteriaGroup] = useState<CriteriaGroup>();

    const signalRService = useRef<SignalRService | null>(null);

    const fetchData = () => {
        getMeetings(Number(id)).then(response => {
            const meeting = response.data[0]
            setMeeting(meeting);
            
            getCriteriaGroup(meeting.criteriaGroup.id).then(response => {
                const group = response.data[0];
                setCriteriaGroup(group);

                setMarks(
                    meeting.studentWorks.map((work: StudentWork) => {
                        const averageMarks = work.averageCriteriaMarks.filter(item => item.averageMark !== null);

                        let average = 0;
                        if (group.metricType === MetricTypes[0].value) {
                            average = Math.round(averageMarks.reduce((sum, mark) =>
                                sum + mark.averageMark, 0) / averageMarks.length * 10) / 10;
                        } else if (group.metricType === MetricTypes[1].value) {
                            average = averageMarks.reduce((sum, mark) =>
                                sum + mark.averageMark, 0);
                        }

                        if (work.finalMark === '' && !isNaN(average)) {
                            setFinalMark(meeting.id, work.id!, calculateFinalMark(Math.round(average), group.markScales));
                        }

                        return {
                            id: work.id,
                            averageMark: average,
                            finalMark: work.finalMark
                        };
                    })
                );
            });
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

    const handleRowClick = (workId: number) => {
        navigate(`/meetings/${id}/studentwork/${workId}`);
    };

    const handleMarkEdit = (e: ChangeEvent<HTMLInputElement>, id: number) => {
        const value = e.target.value;

        setMarks(marks.map(mark => mark.id === id ? {
            ...mark,
            finalMark: value
        } : mark));

        setFinalMark(Number(meeting.id), id, value);
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
                <div className="d-flex p-2 align-items-center">
                    <div>
                        <h4>Список защищающихся студентов</h4>
                        <p className="small mb-0" style={{color: '#9a9d9f'}}>Для перехода к оцениванию нажмите на
                            соответствующую строку таблицы на вкладке «Работы студентов»</p>
                    </div>
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
                                    <th>ФИО</th>
                                    {meeting.studentWorks.some((work) => work.info) ?
                                        (<th>Курс, направление</th>) : (<></>)}
                                    <th>Тема</th>
                                    <th>Научник</th>
                                    {meeting.studentWorks.some((work) => work.consultant) ? (
                                        <th>Консультант</th>) : (<></>)}
                                    {meeting.studentWorks.some((work) => work.reviewer) ? (
                                        <th>Рецензент</th>) : (<></>)}
                                    <th>Оценка научника</th>
                                    {meeting.studentWorks.some((work) => work.reviewerMark) ?
                                        (<th>Оценка рецезента</th>) : (<></>)}
                                    {meeting.studentWorks.some((work) => work.codeLink) ?
                                        (<th>Код</th>) : (<></>)}
                                </tr>
                                </thead>
                                <tbody>
                                {meeting.studentWorks.map((work) => (
                                    <tr key={work.id} onClick={() => handleRowClick(work.id!)}
                                        className={selectedStudentId === work.id ? "table-info" : ""}
                                        style={{cursor: "pointer"}}>
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
                                                            <a href={link} target="_blank"
                                                               rel="noopener noreferrer">
                                                                Ссылка {work.codeLink && work.codeLink.split(' ').length > 1 ? linkIndex + 1 : ''}
                                                            </a>
                                                        </div>
                                                    ))
                                                ) : (<span className="fst-italic">NDA</span>)
                                            ) : (
                                                <span>—</span>
                                            )}</td>) : (<></>)}
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
                                    <th>ФИО</th>
                                    {criteriaGroup?.criteria.map((criteria) => (
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
                                        <td>{work.studentName}</td>
                                        {work.averageCriteriaMarks.map((mark) => (
                                            <td key={mark.criteriaId}
                                                className="text-center">{mark.averageMark ?? "—"}</td>
                                        ))}
                                        <td className="text-center">{marks.find(mark => mark.id === work.id).averageMark || "—"}</td>
                                        <td>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={marks.find(mark => mark.id === work.id).finalMark || ""}
                                                onChange={(e) => handleMarkEdit(e, work.id!)}
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

            {criteriaGroup?.markScales.length !== 0 ? (<>
                <h4 className="p-2">Таблица перевода оценок</h4>

                <div className="table-responsive" style={{maxWidth: '300px'}}>
                    <table className="table table-light table-striped-columns">
                        <thead>
                        <tr>
                            <th className="text-center">Сумма баллов</th>
                            <th className="text-center">Оценка</th>
                        </tr>
                        </thead>
                        <tbody>
                        {criteriaGroup?.markScales.sort((a, b) =>
                            (b.min ?? 0) - (a.min ?? 0)).map((scale, index) => (
                            <tr key={index}>
                                <td className="text-center">{scale.min}-{scale.max}</td>
                                <td className="text-center">{scale.mark}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </>) : (<></>)}
        </>
    );
}

