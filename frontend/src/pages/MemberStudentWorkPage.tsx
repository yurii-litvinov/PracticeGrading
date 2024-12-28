import React, {useEffect, useState, useRef} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    getMeetings,
    getMemberMarks,
    createMemberMark,
    updateMemberMark,
    getMembers
} from '../services/ApiService';
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
    const [anotherMarks, setAnotherMarks] = useState([]);
    const [anotherMembers, setAnotherMembers] = useState([]);

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
        getMeetings(meetingId).then(response => {
            const meeting = response.data[0]
            const criteriaList = meeting.criteria;

            setStudentWork(meeting.studentWorks.find(student => student.id == workId));
            setAnotherMembers(meeting.members.filter(member => member.id != id));

            setCriteria(
                criteriaList.map((criteria) => ({
                    ...criteria,
                    scale: criteria.scale.sort((a, b) => b.value - a.value),
                    rules: criteria.rules.sort((a, b) => b.value - a.value)
                }))
            );
        });

        getMemberMarks(workId).then(response => {
            const marks = response.data;
            const targetMark = marks.find(mark => mark.memberId == id);
            const otherMarks = marks.filter(mark => mark.memberId != id);

            if (targetMark) {
                setMark(targetMark)
                setIsEditing(false);
            }

            setAnotherMarks(otherMarks);
        })
    }

    const handleNotification = (action: string) => {
        if (action.includes(Actions.Update) || action.includes(Actions.SendMark)) {
            fetchData();
        }
    }

    useEffect(() => {
        if (mark.id == null) {
            setMark((prevMark) => ({
                ...prevMark,
                criteriaMarks: criteria.map((element) => ({
                    id: null,
                    criteriaId: element.id,
                    studentWorkId: workId,
                    selectedRules: [],
                    mark: null,
                }))
            }));
        }
        selectRules();
    }, [criteria, mark.id, isEditing]);

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

    const selectRules = () => {
        setMark((prevMark) => {
            const updatedCriteriaMarks = prevMark.criteriaMarks.map((criteriaMark) => {
                if (criteriaMark.selectedRules.filter((rule) => rule.isScaleRule).length == 0) {
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
    }


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

    const handleCommentChange = (e, criteriaId) => {
        const newComment = e.target.value;

        setMark(prevMark => {
            const updatedCriteriaMarks = prevMark.criteriaMarks.map(criteriaMark => {
                if (criteriaMark.criteriaId === criteriaId) {
                    return {
                        ...criteriaMark,
                        comment: newComment
                    };
                }
                return criteriaMark;
            });

            return {
                ...prevMark,
                criteriaMarks: updatedCriteriaMarks
            };
        });
    }

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (mark?.id == null || mark.id === 0) {
            createMemberMark(mark).then(response => signalRService.current.sendNotification(Actions.SendMark));
        } else {
            updateMemberMark(mark).then(response => signalRService.current.sendNotification(Actions.SendMark));
        }

        setIsEditing(false);
    }

    const handleEdit = (event: React.FormEvent) => {
        event.preventDefault();
        setIsEditing(true);
        console.log(anotherMarks)
    }

    const isRuleSelected = (criteriaId, ruleId) => {
        return mark.criteriaMarks.some((criteriaMark) =>
            criteriaMark.criteriaId === criteriaId &&
            criteriaMark.selectedRules.some((selectedRule) => selectedRule.id === ruleId)
        );
    }

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

            <div className="card w-auto mb-4">
                <div className="card-body p-4">
                    <h4 className="card-title text-center mb-2">Моя оценка</h4>

                    <hr className="my-4"/>

                    <div className="d-flex mb-2 align-items-center">
                        <label className="me-1 fs-5 fw-semibold w-auto">Член комиссии:</label>
                        <span className="form-control-plaintext fs-5 w-auto text-wrap">{name}</span>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {criteria.map((criteria, index) => (
                            <div key={criteria.id} className="mb-4">
                                <label
                                    className="mb-2 fw-semibold w-auto">{index + 1}. {criteria.name} {criteria.comment && (
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
                                                   checked={isRuleSelected(criteria.id, rule.id)}
                                                   onChange={() => handleRadioChange(criteria.id, rule)}></input>
                                            <label>
                                                <span className="fw-semibold">{rule.value}</span> — {rule.description}
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                {criteria.rules.length > 0 ? (
                                    <>
                                        <h6 className="w-auto">Дополнительные правила:</h6>
                                        <div>
                                            {criteria.rules.map((rule) => (
                                                <div key={rule.id} className="form-check">
                                                    <input className="form-check-input" type="checkbox"
                                                           disabled={!isEditing}
                                                           checked={isRuleSelected(criteria.id, rule.id)}
                                                           onChange={(e) => handleCheckboxChange(e, criteria.id, rule)}/>
                                                    <label>
                                                        <span
                                                            className="fw-semibold">{rule.value}</span> {rule.description}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : null}

                                <div className="mb-2">
                                    <label className="form-label">Комментарий</label>
                                    <textarea type="text" className="form-control" name="comment"
                                              disabled={!isEditing}
                                              value={mark.criteriaMarks.find(criteriaMark => criteriaMark.criteriaId === criteria.id)?.comment || ''}
                                              onChange={(e) => handleCommentChange(e, criteria.id)}/>
                                </div>

                            </div>
                        ))}

                        <div className="d-flex mb-2 align-items-center">
                            <label className="me-2 fw-semibold fs-5 w-auto">Итоговая оценка:</label>
                            <span
                                className="form-control-plaintext fs-5 w-auto text-wrap">{mark?.mark}</span>
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

            <h4 className="mb-4">Оценки других членов комиссии</h4>

            <div className="accordion" id="marksAccordion">
                {anotherMarks.map((memberMark, index) =>
                    <div className="accordion-item" key={memberMark.memberId}>
                        <h2 className="accordion-header">
                            <button className="accordion-button collapsed"
                                    type="button"
                                    data-bs-toggle="collapse"
                                    data-bs-target={`#collapse${memberMark.memberId}`}
                                    aria-expanded="false"
                                    aria-controls={`collapse${memberMark.memberId}`}>
                                <span
                                    className="fw-semibold me-1">{anotherMembers?.find(member => member.id === memberMark.memberId)?.name}</span>
                                — оценка: {memberMark.mark}
                            </button>
                        </h2>
                        <div id={`collapse${memberMark.memberId}`}
                             className="accordion-collapse collapse"
                             data-bs-parent="#marksAccordion">
                            <div className="accordion-body">
                                {criteria.map((criteria, index) => (
                                    <div key={criteria.id} className="mb-2">
                                        <label
                                            className="mb-2 w-auto"><span
                                            className="fw-semibold me-1">{index + 1}. {criteria.name}:</span>
                                            {memberMark.criteriaMarks.find(mark => mark.criteriaId === criteria.id).mark}
                                        </label>

                                        <ul className="list-unstyled ps-3 mb-1">
                                            {memberMark.criteriaMarks.find(mark => mark.criteriaId === criteria.id)
                                                .selectedRules.sort((a, b) => b.value - a.value).map((rule, index) => (
                                                    <li key={index}>
                                                        {rule.isScaleRule ? (<>{rule.value} — {rule.description}</>)
                                                            : (<>{rule.value} {rule.description}</>)}
                                                    </li>
                                                ))}
                                        </ul>

                                        {memberMark.criteriaMarks.find(mark => mark.criteriaId === criteria.id).comment ?
                                            (<p
                                                className="w-auto fst-italic ms-3">Комментарий: {memberMark.criteriaMarks.find(mark => mark.criteriaId === criteria.id).comment}</p>)
                                            : null}

                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

