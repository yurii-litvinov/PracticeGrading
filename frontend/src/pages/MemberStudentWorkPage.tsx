import React, {useEffect, useState, useRef} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {getStudentWork, getMeetings} from '../services/ApiService';
import 'react-datepicker/dist/react-datepicker.css';
import {formatDate} from './MeetingsPage';
import {SignalRService} from '../services/SignalRService';
import {Actions} from '../models/Actions';
import {jwtDecode} from "jwt-decode";
import {Criteria} from "../models/Criteria"

export function MemberStudentWorkPage() {
    const {meetingId, workId} = useParams();
    const navigate = useNavigate();
    const [criteria, setCriteria] = useState<Criteria[]>([]);
    const [studentWork, setStudentWork] = useState({});
    
    const token = sessionStorage.getItem('token');
    let name = '';
    let id = '';
    if (token) {
        const decoded = jwtDecode(token);
        name = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
        id = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]
    }

    const [mark, setMark] = useState({
        memberId: id,
        studentWorkId: workId,
        criteriaMarks: [],
        mark: null
    });

    const signalRService = useRef<SignalRService | null>(null);

    const handleNotification = (action: string) => {
        switch (true) {
            case action.includes(Actions.Update):
                getStudentWork(meetingId, workId).then(response => setStudentWork(response.data));
                getMeetings(meetingId).then(response => setCriteria(response.data[0].criteria));
        }
    }

    useEffect(() => {
        if (workId) {
            getStudentWork(meetingId, workId).then(response => setStudentWork(response.data));
            getMeetings(meetingId).then(response => setCriteria(response.data[0].criteria));

            signalRService.current = new SignalRService(meetingId, handleNotification);
            signalRService.current.startConnection();
            console.log(criteria)
        }

        return () => {
            if (signalRService.current) signalRService.current.stopConnection();
            signalRService.current = null;
        }
    }, [workId]);

    const handleBack = () => {
        navigate(`/meetings/${meetingId}/member`, {replace: true});
    }

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        console.log("Form data submitted:", formData);
    };

    return (
        <>
            <div className="d-flex flex-column flex-sm-row align-items-start justify-content-end w-100">
                <div className="d-flex flex-column flex-sm-row justify-content-end w-100">
                    <button type="button" className="btn btn-light btn-lg mb-2 mb-sm-0 me-sm-2"
                            onClick={handleBack}>Назад к заседанию
                    </button>
                </div>
            </div>

            <div className="d-flex flex-column p-2">
                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">ФИО студента</label>
                    <span className="form-control-plaintext text-wrap span-custom">{studentWork.studentName}</span>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Тема практики/ВКР</label>
                    <span className="form-control-plaintext text-wrap span-custom">{studentWork.theme}</span>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Научный руководитель</label>
                    <span className="form-control-plaintext text-wrap span-custom">{studentWork.supervisor}</span>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Консультант</label>
                    <span
                        className="form-control-plaintext text-wrap span-custom">{studentWork.consultant || "—"}</span>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Рецензент</label>
                    <span className="form-control-plaintext text-wrap span-custom">{studentWork.reviewer || "—"}</span>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Ссылка на код</label>
                    <span className="form-control-plaintext w-auto text-wrap">{studentWork.codeLink ? (
                        <a href={studentWork.codeLink} target="_blank" rel="noopener noreferrer">
                            Ссылка
                        </a>
                    ) : (
                        <span>—</span>
                    )}</span>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Оценка научного руководителя</label>
                    <span className="form-control-plaintext w-auto text-wrap">{studentWork.supervisorMark || "—"}</span>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Оценка рецензента</label>
                    <span className="form-control-plaintext w-auto text-wrap">{studentWork.reviewerMark || "—"}</span>
                </div>
            </div>

            <div className="card w-auto">
                <div className="card-body p-4">
                    <h4 className="card-title text-center mb-2">Моя оценка</h4>

                    <div className="d-flex mb-2 align-items-center">
                        <label className="me-1 fw-bold w-auto">Член комиссии:</label>
                        <span className="form-control-plaintext w-auto text-wrap">{name}</span>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {criteria.map((criteria, index) => (
                            <div key={criteria.id} className="mb-4">
                                <label
                                    className="mb-2 fw-bold w-auto">{index + 1}. {criteria.name} {criteria.comment && (
                                    <>
                                        <br/>
                                        <small className="fs-6 fw-normal"
                                               style={{color: '#9a9d9f'}}>{criteria.comment}</small>
                                    </>
                                )}</label>

                                <h6 className="w-auto">Шкала оценивания:</h6>
                                <div className="mb-2">
                                    {criteria.scale.map((rule, ruleIndex) => (
                                        <div key={rule.id} className="form-check">
                                            <input className="form-check-input" type="radio" name={criteria.id}
                                                   defaultChecked={ruleIndex === 0}></input>
                                            <label className="form-check-label">
                                                <span className="fw-semibold">{rule.value}</span> — {rule.description}
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <h6 className="w-auto">Дополнительные правила:</h6>
                                <div>
                                    {criteria.rules.map((rule) => (
                                        <div key={rule.id} className="form-check">
                                            <input className="form-check-input" type="checkbox"></input>
                                            <label className="form-check-label">
                                                <span className="fw-semibold">{rule.value}</span> {rule.description}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        
                        <div className="d-flex mb-2 align-items-center">
                            <label className="me-1 fw-bold w-auto">Член комиссии:</label>
                            <span className="form-control-plaintext w-auto text-wrap">{name}</span>
                        </div>

                        <button type="submit" className="btn btn-primary float-end btn-lg">Сохранить</button>
                    </form>
                </div>
            </div>
        </>
    );
}

