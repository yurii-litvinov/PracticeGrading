import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMeetings, setFinalMark, getCriteriaGroup } from '../services/ApiService';
import 'react-datepicker/dist/react-datepicker.css';
import { formatDate } from './MeetingsPage';
import { SignalRService } from '../services/SignalRService';
import { Actions } from '../models/Actions';
import { Meeting } from '../models/Meeting';
import { CriteriaGroup } from '../models/CriteriaGroup';
import { StudentWork } from '../models/StudentWork';
import { MetricTypes } from '../models/MetricTypes'
import { MarkScale } from '../models/MarkScale'
import Tooltip from 'bootstrap/js/dist/tooltip.js';
import copy from 'copy-to-clipboard';
import { DocumentsModel } from '../components/DocumentsModel';
import { BASENAME } from "../App"
import { MemberList } from '../components/MemberList';

export const calculateFinalMark = (mark: number, scales: MarkScale[] | undefined) => {
    const matchedScale = scales?.find(scale =>
        scale.min !== undefined &&
        scale.max !== undefined &&
        scale.min <= mark && mark <= scale.max
    );

    return matchedScale?.mark ?? String(mark);
};

export function ViewMeetingPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("works");
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [meeting, setMeeting] = useState<Meeting>({
        dateAndTime: new Date(),
        auditorium: '',
        info: '',
        callLink: '',
        materialsLink: '',
        studentWorks: [],
        members: [],
        criteriaGroup: undefined
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [marks, setMarks] = useState<any[]>([]);
    const [criteriaGroup, setCriteriaGroup] = useState<CriteriaGroup>();

    const signalRService = useRef<SignalRService | null>(null);
    const tooltipRef = useRef<Tooltip | null>(null);

    const fetchData = () => {
        getMeetings(Number(id)).then(response => {
            const meeting = response.data[0];
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
        console.log(action)
        if (action.includes(Actions.Join) || action.includes(Actions.SendMark)) {
            fetchData()
            signalRService.current?.sendNotification(`${Actions.Highlight}:${selectedStudentId}`);
        }
    }


    useEffect(() => {
        const tooltipElement = document.getElementById('copy');
        tooltipRef.current = new Tooltip(tooltipElement!);

        if (id) {
            fetchData();

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
        window.history.back();
    }

    const handleEditMeeting = () => {
        navigate(`/meetings/edit/${id}`);
    }

    const handleFinishMeeting = () => {
        navigate(`/meetings/finish/${id}`);
    }


    const handleRowClick = (id: number) => {
        setSelectedStudentId(id === selectedStudentId ? null : id);
        signalRService.current?.sendNotification(`${Actions.Highlight}:${id === selectedStudentId ? null : id}`);
    };

    const handleIconClick = (workId: number) => {
        navigate(`/meetings/${id}/studentwork/${workId}`);
    };

    const handleMarkEdit = (e: ChangeEvent<HTMLInputElement>, id: number) => {
        const value = e.target.value;

        setMarks(marks.map(mark => mark.id === id ? {
            ...mark,
            finalMark: value
        } : mark));

        setFinalMark(meeting.id!, id, value);
    }

    const handleCopyLink = () => {
        copy(`${window.location.origin}${BASENAME}/meetings/${id}/member`);
        tooltipRef.current?.dispose();

        const tooltipElement = document.getElementById('copy');
        tooltipElement?.setAttribute('title', 'Скопировано!');
        tooltipRef.current = new Tooltip(tooltipElement!);
        tooltipRef.current.show();

        setTimeout(() => {
            tooltipRef.current?.dispose();
            const tooltipElement = document.getElementById('copy');
            tooltipElement?.setAttribute('title', 'Копировать ссылку');
            tooltipRef.current = new Tooltip(tooltipElement!);
        }, 700);
    }

    return (
        <>
            <div className="d-flex flex-column flex-sm-row align-items-start justify-content-end w-100">
                <h2 className="me-auto w-100 mb-3 mb-sm-0 text-center text-sm-start">Просмотр заседания</h2>
                <div className="d-flex flex-column flex-sm-row justify-content-end w-100">
                    <button type="button" className="btn btn-outline-primary btn-lg mb-2 mb-sm-0 me-sm-2"
                        onClick={handleEditMeeting}>Редактировать
                    </button>
                    <button type="button" className="btn btn-outline-success btn-lg mb-2 mb-sm-0 me-sm-2"
                        onClick={handleFinishMeeting}>Завершить
                    </button>
                    <button type="button" className="btn btn-light btn-lg mb-2 mb-sm-0 me-sm-2"
                        id="back" onClick={handleBack}>Назад
                    </button>
                </div>
            </div>

            <div className="d-flex flex-column p-2">
                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Ссылка для членов
                        комиссии</label>
                    <a href="#" id="copy" data-bs-custom-class="tooltip-light" data-bs-toggle="tooltip"
                        data-bs-trigger="hover" data-bs-placement="top" title="Копировать ссылку"
                        className="icon-link icon-link-hover form-control-plaintext text-primary text-decoration-underline w-auto"
                        style={{ '--bs-icon-link-transform': 'translate3d(0, -.125rem, 0)' } as any}
                        onClick={(e) => {
                            e.preventDefault();
                            handleCopyLink();
                        }}>
                        {`${window.location.origin}${BASENAME}/meetings/${id}/member`}
                        <i className="bi bi-clipboard mb-2" />
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
                            className="form-control-plaintext text-primary text-decoration-underline w-auto span-custom"
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

            <div className="d-flex flex-column flex-sm-row justify-content-end w-100">
                <button type="button" className="btn btn-outline-primary btn-lg mb-2 mb-sm-0 me-sm-2"
                    data-bs-toggle="modal"
                    data-bs-target="#docsModal">Сгенерировать документы
                </button>
            </div>

            <DocumentsModel meeting={meeting} />

            <hr className="my-4" />

            <div>
                <div className="d-flex p-2 align-items-center">
                    <h4>Список защищающихся студентов</h4>
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
                                                style={{ cursor: "pointer" }}>
                                                <td style={{ width: '30px' }}>
                                                    <button type="button" className="btn btn-sm btn-link" onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleIconClick(work.id!);
                                                    }}>
                                                        <i className="bi bi-arrows-angle-expand fs-5"
                                                            style={{ color: '#007bff' }}></i>
                                                    </button>
                                                </td>
                                                <td>{work.studentName}</td>
                                                {meeting.studentWorks.some((work) => work.info) ?
                                                    (<td>{work.info || "—"}</td>) : (<></>)}
                                                <td style={{ maxWidth: '600px' }}>{work.theme}</td>
                                                <td>{work.supervisor}</td>
                                                {meeting.studentWorks.some((work) => work.consultant) ? (
                                                    <td>{work.consultant || "—"}</td>) : (<></>)}
                                                {meeting.studentWorks.some((work) => work.reviewer) ?
                                                    (<td>{work.reviewer || "—"}</td>) : (<></>)}
                                                <td>{work.supervisorMark || "—"}</td>
                                                {meeting.studentWorks.some((work) => work.reviewerMark) ?
                                                    (<td>{work.reviewerMark || "—"}</td>) : (<></>)}
                                                {meeting.studentWorks.some((work) => work.codeLink) ?
                                                    (<td style={{ minWidth: '87px' }}>{work.codeLink ? (
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
                        </div>)}
                    {activeTab === "marks" && (
                        <div className="tab-pane fade show active">
                            <div className="table-responsive">
                                <table className="table table-striped">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>ФИО</th>
                                            {criteriaGroup?.criteria?.map((criteria) => (
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
                                                <td style={{ width: '30px' }}>
                                                    <button type="button" className="btn btn-sm btn-link" onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleIconClick(work.id!);
                                                    }}>
                                                        <i className="bi bi-arrows-angle-expand fs-5"
                                                            style={{ color: '#007bff' }}></i>
                                                    </button>
                                                </td>
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

                <hr className="my-4" />

                <div className="d-flex flex-wrap">
                    <div className="flex-grow-1 pe-4 mb-2" style={{ minWidth: '20em' }}>
                        <h4 className="p-2">Список членов комиссии</h4>
                        <MemberList
                            members={meeting.members}
                        >
                        </MemberList>
                    </div>

                    <div className="flex-grow-1">
                        <div className="card">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h4 className="card-title mb-0">{criteriaGroup?.name}</h4>
                                </div>
                                <p className="card-text p-2 pb-0">
                                    <strong>Метрика:</strong> {MetricTypes.find(type => type.value === criteriaGroup?.metricType)?.label}
                                </p>

                                {criteriaGroup?.markScales.length !== 0 ? (<>
                                    <strong className="card-text p-2 pt-0">Таблица перевода оценок</strong>

                                    <div className="table-responsive" style={{ maxWidth: '300px' }}>
                                        <table className="table table-light table-striped-columns m-2">
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
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

