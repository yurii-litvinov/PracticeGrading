import React, {useEffect, useState, useRef} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {getStudentWork, getMeetings, getMemberMarks, createMemberMark, updateMemberMark} from '../services/ApiService';
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
    const [isEditing, setIsEditing] = useState(true);

    const token = sessionStorage.getItem('token');
    let name = '';
    let id = '';
    if (token) {
        const decoded = jwtDecode(token);
        name = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
        id = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]
    }

    const [mark, setMark] = useState({
        id: null,
        memberId: id,
        studentWorkId: workId,
        criteriaMarks: [],
        mark: 0
    });

    const signalRService = useRef<SignalRService | null>(null);

    const fetchData = () => {
        getStudentWork(meetingId, workId).then(response => setStudentWork(response.data));

        getMeetings(meetingId).then(response => {
            const criteriaList = response.data[0].criteria;

            setCriteria(
                criteriaList.map((criteria) => ({
                    ...criteria,
                    scale: criteria.scale.sort((a, b) => b.value - a.value),
                    rules: criteria.rules.sort((a, b) => b.value - a.value)
                }))
            );

            setMark((prevMark) => ({
                ...prevMark,
                criteriaMarks: criteriaList.map((criteria) => ({
                    id: null,
                    criteriaId: criteria.id,
                    memberMarkId: id,
                    selectedRules: [],
                    mark: null,
                }))
            }));
        });

        getMemberMarks(id, workId).then(response => setMark(response.data[0]));
    }

    const handleNotification = (action: string) => {
        switch (true) {
            case action.includes(Actions.Update || Actions.SendMark):
                fetchData();
        }
    }

    useEffect(() => {
        if (mark?.id == null || mark.id === 0) {
            setIsEditing(true);
        } else {
            setIsEditing(false);
        }
    }, [mark.id]);

    useEffect(() => {
        if (workId) {
            fetchData();

            signalRService.current = new SignalRService(meetingId, handleNotification);
            signalRService.current.startConnection();
        }

        return () => {
            if (signalRService.current) signalRService.current.stopConnection();
            signalRService.current = null;
        }
    }, [workId]);

    useEffect(() => {
        setMark((prevMark) => {
            const updatedCriteriaMarks = prevMark.criteriaMarks.map((criteriaMark) => {
                if (criteriaMark.selectedRules.length === 0) {
                    const firstRule = criteria.find(criteria => criteria.id === criteriaMark.criteriaId)?.scale[0];
                    if (firstRule) {
                        return {
                            ...criteriaMark,
                            selectedRules: [firstRule],
                            mark: firstRule.value
                        };
                    }
                }
                return criteriaMark;
            });

            return {
                ...prevMark,
                criteriaMarks: updatedCriteriaMarks
            }
        });

        calculateMark();
    }, [criteria]);

    const handleBack = () => {
        navigate(`/meetings/${meetingId}/member`, {replace: true});
    }

    const calculateMark = () => {
        setMark((prevMark) => {
            let finalMark = prevMark.criteriaMarks[0]?.mark || 0;

            prevMark.criteriaMarks.forEach((criteriaMark) => {
                if (criteriaMark.mark !== null) {
                    finalMark = Math.min(finalMark, criteriaMark.mark);
                }
            });
            
            if (finalMark < 2) finalMark = 2;

            return {
                ...prevMark,
                mark: finalMark
            }
        });
    }

    const handleCheckboxChange = (e, criteriaId, rule) => {
        setMark((prevMark) => {
            const updatedCriteriaMarks = prevMark.criteriaMarks.map((criteriaMark) => {
                if (criteriaMark.criteriaId === criteriaId) {
                    const updatedSelectedRules = [...criteriaMark.selectedRules];

                    if (e.target.checked) {
                        updatedSelectedRules.push(rule);
                    } else {
                        updatedSelectedRules.splice(updatedSelectedRules.indexOf(rule), 1);
                    }

                    return {
                        ...criteriaMark,
                        selectedRules: updatedSelectedRules,
                        mark: updatedSelectedRules.reduce((sum, selectedRule) => sum + selectedRule.value, 0)
                    };
                }
                return criteriaMark;
            });

            return {
                ...prevMark,
                criteriaMarks: updatedCriteriaMarks
            }
        });

        calculateMark();
    }

    const handleRadioChange = (criteriaId, rule) => {
        setMark((prevMark) => {
            const updatedCriteriaMarks = prevMark.criteriaMarks.map((criteriaMark) => {
                if (criteriaMark.criteriaId === criteriaId) {
                    const notScaleRules = criteriaMark.selectedRules.filter(rule => !rule.isScaleRule);
                    notScaleRules.push(rule)

                    return {
                        ...criteriaMark,
                        selectedRules: notScaleRules,
                        mark: notScaleRules.reduce((sum, selectedRule) => sum + selectedRule.value, 0)
                    };
                }
                return criteriaMark;
            });

            return {
                ...prevMark,
                criteriaMarks: updatedCriteriaMarks,
            }
        });
        
        calculateMark();
    }

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        
        if (mark?.id == null || mark.id === 0) {
            createMemberMark(mark).then(response => signalRService.current.sendNotification(Actions.SendMark));
        } else {
            updateMemberMark(mark).then(response => signalRService.current.sendNotification(Actions.SendMark));
        }

        setIsEditing(false);
    };

    const handleEdit = (event: React.FormEvent) => {
        event.preventDefault();
        setIsEditing(true);
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
                    <span
                        className="form-control-plaintext text-wrap span-custom">{studentWork.studentName}</span>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Тема практики/ВКР</label>
                    <span className="form-control-plaintext text-wrap span-custom">{studentWork.theme}</span>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Научный руководитель</label>
                    <span
                        className="form-control-plaintext text-wrap span-custom">{studentWork.supervisor}</span>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Консультант</label>
                    <span
                        className="form-control-plaintext text-wrap span-custom">{studentWork.consultant || "—"}</span>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Рецензент</label>
                    <span
                        className="form-control-plaintext text-wrap span-custom">{studentWork.reviewer || "—"}</span>
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
                    <span
                        className="form-control-plaintext w-auto text-wrap">{studentWork.supervisorMark || "—"}</span>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Оценка рецензента</label>
                    <span
                        className="form-control-plaintext w-auto text-wrap">{studentWork.reviewerMark || "—"}</span>
                </div>
            </div>

            <div className="card w-auto">
                <div className="card-body p-4">
                    <h4 className="card-title text-center mb-2">Моя оценка</h4>

                    <div className="d-flex mb-2 align-items-center">
                        <label className="me-1 fs-5 fw-bold w-auto">Член комиссии:</label>
                        <span className="form-control-plaintext fs-5 w-auto text-wrap">{name}</span>
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
                                                   disabled={!isEditing}
                                                   checked={mark.criteriaMarks.some((criteriaMark) =>
                                                       criteriaMark.criteriaId === criteria.id && criteriaMark.selectedRules.includes(rule))}
                                                   onChange={() => handleRadioChange(criteria.id, rule)}></input>
                                            <label className="form-check-label">
                                                        <span
                                                            className="fw-semibold">{rule.value}</span> — {rule.description}
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <h6 className="w-auto">Дополнительные правила:</h6>
                                <div>
                                    {criteria.rules.map((rule) => (
                                        <div key={rule.id} className="form-check">
                                            <input className="form-check-input" type="checkbox"
                                                   disabled={!isEditing}
                                                   checked={mark.criteriaMarks.some((criteriaMark) =>
                                                       criteriaMark.criteriaId === criteria.id && criteriaMark.selectedRules.includes(rule))}
                                                   onChange={(e) => handleCheckboxChange(e, criteria.id, rule)}></input>
                                            <label className="form-check-label">
                                                        <span
                                                            className="fw-semibold">{rule.value}</span> {rule.description}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <div className="d-flex mb-2 align-items-center">
                            <label className="me-2 fw-bold fs-5 w-auto">Итоговая оценка:</label>
                            <span
                                className="form-control-plaintext fs-5 w-auto text-wrap">{mark.mark}</span>
                        </div>

                        {isEditing ? (
                            <button type="submit" className="btn btn-primary float-end btn-lg">
                                Сохранить
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-secondary float-end btn-lg"
                                onClick={(e) => handleEdit(e)}
                            >
                                Редактировать
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}

