import React, {useEffect, useState, useRef} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    getMeetings,
    getMemberMarks,
    createMemberMark,
    updateMemberMark,
    getMembers,
    deleteMemberMark
} from '../services/ApiService';
import 'react-datepicker/dist/react-datepicker.css';
import {formatDate} from './MeetingsPage';
import {SignalRService} from '../services/SignalRService';
import {Actions} from '../models/Actions';
import {jwtDecode} from "jwt-decode";
import {Criteria} from "../models/Criteria"

export function StudentWorkPage() {
    const {meetingId, workId} = useParams();
    const navigate = useNavigate();
    const [criteria, setCriteria] = useState<Criteria[]>([]);
    const [studentWork, setStudentWork] = useState({});
    const [otherMarks, setOtherMarks] = useState([]);
    const [otherMembers, setOtherMembers] = useState([]);
    const [isChanged, setIsChanged] = useState(false);
    const closeButtonRef = useRef();

    const token = sessionStorage.getItem('token');
    let name = '';
    let id = '';
    let role = '';
    if (token) {
        const decoded = jwtDecode(token);
        name = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
        id = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]
        role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    }

    const initialMarkState = {
        id: null,
        memberId: id,
        studentWorkId: workId,
        criteriaMarks: [],
        mark: 0,
        comment: ''
    }

    const [mark, setMark] = useState(initialMarkState);

    const signalRService = useRef<SignalRService | null>(null);

    const fetchData = () => {
        getMeetings(meetingId).then(response => {
            const meeting = response.data[0]
            const criteriaList = meeting.criteria;

            setStudentWork(meeting.studentWorks.find(student => student.id == workId));
            setOtherMembers(meeting.members.filter(member => member.id != id));

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
            }

            setOtherMarks(otherMarks);
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
    }, [criteria, mark.id]);

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
                        updatedSelectedRules.splice(updatedSelectedRules.findIndex(r => r.id === rule.id), 1);
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
        setIsChanged(true);
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
        setIsChanged(true);
    }

    const handleCommentChange = (e, criteriaId) => {
        const newComment = e.target.value;

        if (criteriaId === null) {
            setMark(prevMark => ({
                ...prevMark,
                comment: newComment
            }));
        } else {
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
        
        setIsChanged(true);
    }

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        saveMark();
    }

    const saveMark = () => {
        if (mark?.id == null || mark.id === 0) {
            createMemberMark(mark).then(response => signalRService.current.sendNotification(Actions.SendMark));
        } else {
            updateMemberMark(mark).then(response => signalRService.current.sendNotification(Actions.SendMark));
        }

        if (role === 'admin' && closeButtonRef.current) {
            closeButtonRef.current.click();
        }
    }

    useEffect(() => {
        const handler = setTimeout(() => {
            if (role === 'member' && isChanged) {
                saveMark();
                setIsChanged(false);
            }
        }, 1000);

        return () => clearTimeout(handler);
    }, [mark]);

    const handleBack = () => {
        window.history.back();
    }

    const isRuleSelected = (criteriaId, ruleId) => {
        return mark.criteriaMarks.some((criteriaMark) =>
            criteriaMark.criteriaId === criteriaId &&
            criteriaMark.selectedRules.some((selectedRule) => selectedRule.id === ruleId)
        );
    }

    const handleDeleteMark = async (memberId) => {
        const isConfirmed = window.confirm('Вы уверены, что хотите удалить эту оценку?');
        if (isConfirmed) {
            await deleteMemberMark(workId, memberId);
            signalRService.current.sendNotification(Actions.Update);
        }
    }

    const handleClose = () => {
        setMark(initialMarkState);
        signalRService.current.sendNotification(Actions.Update);
    }

    return (
        <>
            <div className="d-flex flex-column p-2">
                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">ФИО студента</label>
                    <span
                        className="form-control-plaintext text-wrap span-custom">{studentWork.studentName}</span>
                </div>

                {studentWork.info ? (<div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Курс, направление</label>
                    <span
                        className="form-control-plaintext text-wrap span-custom">{studentWork.info}</span>
                </div>) : (<></>)}

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Тема практики/ВКР</label>
                    <span className="form-control-plaintext text-wrap span-custom">{studentWork.theme}</span>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Научный руководитель</label>
                    <span
                        className="form-control-plaintext text-wrap span-custom">{studentWork.supervisor}</span>
                </div>

                {studentWork.consultant ? (<div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Консультант</label>
                    <span
                        className="form-control-plaintext text-wrap span-custom">{studentWork.consultant}</span>
                </div>) : (<></>)}

                {studentWork.reviewer ? (<div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Рецензент</label>
                    <span
                        className="form-control-plaintext text-wrap span-custom">{studentWork.reviewer || "—"}</span>
                </div>) : (<></>)}

                {studentWork.codeLink ? (<div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Ссылка на код</label>
                    <span className="form-control-plaintext w-auto text-wrap">{studentWork.codeLink !== 'NDA' ? (
                        studentWork.codeLink.split(' ').map((link, linkIndex) => (
                            <div key={linkIndex} className="mb-2">
                                <a href={link} target="_blank" rel="noopener noreferrer">
                                    Ссылка {studentWork.codeLink.split(' ').length > 1 ? linkIndex + 1 : ''}
                                </a>
                            </div>
                        ))
                    ) : (
                        <span className="fst-italic">NDA</span>
                    )}</span>
                </div>) : (<></>)}

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Оценка научного руководителя</label>
                    <span
                        className="form-control-plaintext w-auto text-wrap">{studentWork.supervisorMark || "—"}</span>
                </div>

                {studentWork.reviewerMark ? (<div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Оценка рецензента</label>
                    <span
                        className="form-control-plaintext w-auto text-wrap">{studentWork.reviewerMark || "—"}</span>
                </div>) : (<></>)}
            </div>

            {role === 'member' ? (<>
                    <div className="card w-auto mb-4">
                        <div className="card-body p-4">
                            <h4 className="card-title text-center mb-2">Моя оценка</h4>

                            <hr className="my-4"/>

                            <div className="d-flex mb-2 align-items-center">
                                <label className="me-1 fs-5 fw-semibold w-auto">Член комиссии:</label>
                                <span className="form-control-plaintext fs-5 w-auto text-wrap">{name}</span>
                            </div>

                            <form>
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
                                                           checked={isRuleSelected(criteria.id, rule.id)}
                                                           onChange={() => handleRadioChange(criteria.id, rule)}></input>
                                                    <label>
                                                        <span
                                                            className="fw-semibold">{rule.value}</span> — {rule.description}
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

                                        <div className="my-2">
                                            <h6>Комментарий:</h6>
                                            <textarea type="text" className="form-control" name="comment"
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

                                <div className="my-2">
                                    <h6>Общий комментарий:</h6>
                                    <textarea type="text" className="form-control" name="comment"
                                              value={mark.comment}
                                              onChange={(e) => handleCommentChange(e, null)}/>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="d-flex flex-column flex-sm-row align-items-start justify-content-end w-100">
                        <div className="d-flex flex-column flex-sm-row justify-content-end w-100">
                            <button type="button" className="btn btn-light btn-lg mb-2 mb-sm-0 me-sm-2"
                                    onClick={handleBack}>Назад к заседанию
                            </button>
                        </div>
                    </div>

                    <h4 className="mb-4">Оценки других членов комиссии</h4>

                    <div className="accordion" id="marksAccordion">
                        {otherMarks.map((memberMark, index) =>
                            <div className="accordion-item" key={memberMark.memberId}>
                                <h2 className="accordion-header">
                                    <button className="accordion-button collapsed"
                                            type="button"
                                            data-bs-toggle="collapse"
                                            data-bs-target={`#collapse${memberMark.memberId}`}
                                            aria-expanded="false"
                                            aria-controls={`collapse${memberMark.memberId}`}>
                                <span
                                    className="fw-semibold me-1">{otherMembers?.find(member => member.id === memberMark.memberId)?.name}</span>
                                        оценка: {memberMark.mark}
                                    </button>
                                </h2>
                                <div id={`collapse${memberMark.memberId}`}
                                     className="accordion-collapse collapse"
                                     data-bs-parent="#marksAccordion">
                                    <div className="accordion-body">
                                        {criteria.map((criteria, index) => (
                                            <div key={criteria.id} className="mb-2">
                                                <label
                                                    className="w-auto"><span
                                                    className="fw-semibold me-1">{index + 1}. {criteria.name}:</span>
                                                    {memberMark.criteriaMarks.find(mark => mark.criteriaId === criteria.id)?.mark}
                                                </label>

                                                <ul className="list-unstyled ps-3 mb-1">
                                                    {memberMark.criteriaMarks.find(mark => mark.criteriaId === criteria.id)
                                                        ?.selectedRules.sort((a, b) => b.value - a.value).map((rule, index) => (
                                                            <li key={index}>
                                                                {rule.isScaleRule ? (<>{rule.value} — {rule.description}</>)
                                                                    : (<>{rule.value} {rule.description}</>)}
                                                            </li>
                                                        ))}
                                                </ul>

                                                {memberMark.criteriaMarks.find(mark => mark.criteriaId === criteria.id)?.comment ?
                                                    (<p
                                                        className="w-auto fst-italic ms-3">Комментарий: {memberMark.criteriaMarks.find(mark => mark.criteriaId === criteria.id).comment}</p>)
                                                    : null}

                                            </div>
                                        ))}

                                        {memberMark.comment !== '' ?
                                            (<div className="w-auto fst-italic ms-3 text-wrap">
                                                <span className="fw-semibold">Общий комментарий:</span> {memberMark.comment}
                                            </div>) : null}

                                    </div>
                                </div>
                            </div>
                        )
                        }
                    </div>
                </>) :
                (<>
                        <div className="d-flex flex-column flex-sm-row align-items-start justify-content-end w-100">
                            <div className="d-flex flex-column flex-sm-row justify-content-end w-100">
                                <button type="button" className="btn btn-light btn-lg mb-2 mb-sm-0 me-sm-2"
                                        onClick={handleBack}>Назад к заседанию
                                </button>
                            </div>
                        </div>

                        <hr className="mb-4"/>

                        <h4 className="mb-4">Оценки членов комиссии</h4>

                        {otherMarks.length === 0 ? (
                            <div className="alert alert-primary" role="alert">
                                Нет оценок для отображения.
                            </div>
                        ) : (<>
                            <div className="accordion" id="marksAccordion">
                                {otherMarks.map((memberMark, index) =>
                                        <div className="accordion-item" key={memberMark.memberId}>
                                            <h2 className="accordion-header d-flex justify-content-between align-items-center">
                                                <button className="accordion-button collapsed"
                                                        type="button"
                                                        data-bs-toggle="collapse"
                                                        data-bs-target={`#collapse${memberMark.memberId}`}
                                                        aria-expanded="false"
                                                        aria-controls={`collapse${memberMark.memberId}`}>
                                <span
                                    className="fw-semibold me-1">{otherMembers?.find(member => member.id === memberMark.memberId)?.name}</span>
                                                    оценка: {memberMark.mark}
                                                </button>
                                                <button type="button" id="delete-criteria" className="btn btn-sm btn-link"
                                                        style={{height: '40px'}}
                                                        onClick={() => handleDeleteMark(memberMark.memberId)}>
                                                    <i className="bi bi-x-lg fs-5" style={{color: 'red'}}></i>
                                                </button>
                                                <button type="button" className="btn btn-sm me-3 btn-link"
                                                        data-bs-toggle="modal" data-bs-target="#markModal"
                                                        onClick={() => setMark(memberMark)}>
                                                    <i className="bi bi-pencil fs-5" style={{color: '#007bff'}}></i>
                                                </button>
                                            </h2>
                                            <div id={`collapse${memberMark.memberId}`}
                                                 className="accordion-collapse collapse"
                                                 data-bs-parent="#marksAccordion">
                                                <div className="accordion-body">
                                                    {criteria.map((criteria, index) => (
                                                        <div key={criteria.id} className="mb-2">
                                                            <label
                                                                className="w-auto"><span
                                                                className="fw-semibold me-1">{index + 1}. {criteria.name}:</span>
                                                                {memberMark.criteriaMarks.find(mark => mark.criteriaId === criteria.id)?.mark}
                                                            </label>

                                                            <ul className="list-unstyled ps-3 mb-1">
                                                                {memberMark.criteriaMarks.find(mark => mark.criteriaId === criteria.id)
                                                                    ?.selectedRules.sort((a, b) => b.value - a.value).map((rule, index) => (
                                                                        <li key={index}>
                                                                            {rule.isScaleRule ? (<>{rule.value} — {rule.description}</>)
                                                                                : (<>{rule.value} {rule.description}</>)}
                                                                        </li>
                                                                    ))}
                                                            </ul>

                                                            {memberMark.criteriaMarks.find(mark => mark.criteriaId === criteria.id)?.comment ?
                                                                (<p
                                                                    className="w-auto fst-italic ms-3">Комментарий: {memberMark.criteriaMarks.find(mark => mark.criteriaId === criteria.id).comment}</p>)
                                                                : null}

                                                        </div>
                                                    ))}

                                                    {memberMark.comment ?
                                                        (<p className="w-auto">
                                                            <span className="fw-semibold me-1">Общий комментарий:</span>{memberMark.comment}
                                                        </p>)
                                                        : null}
                                                </div>
                                            </div>
                                        </div>
                                )}
                            </div>
                        </>)}

                        <div className="modal fade" id="markModal" data-bs-backdrop="static"
                             data-bs-keyboard="false"
                             tabIndex="-1"
                             aria-labelledby="staticBackdropLabel" aria-hidden="true">
                            <div className="modal-dialog modal-lg">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h1 className="modal-title fs-5 ps-4"
                                            id="staticBackdropLabel">Редактирование оценки члена комиссии</h1>
                                        <button type="button" className="btn-close"
                                                data-bs-dismiss="modal" ref={closeButtonRef} onClick={handleClose}
                                                aria-label="Close"></button>
                                    </div>

                                    <div className="modal-body">
                                        <div className="d-flex mb-2 align-items-center">
                                            <label className="me-1 fs-5 fw-semibold w-auto">Член комиссии:</label>
                                            <span
                                                className="form-control-plaintext fs-5 w-auto text-wrap">{otherMembers?.find(member => member.id === mark.memberId)?.name}</span>
                                        </div>

                                        <form className="px-4">
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
                                                                <input className="form-check-input" type="radio"
                                                                       name={criteria.id}
                                                                       checked={isRuleSelected(criteria.id, rule.id)}
                                                                       onChange={() => handleRadioChange(criteria.id, rule)}></input>
                                                                <label>
                                                        <span
                                                            className="fw-semibold">{rule.value}</span> — {rule.description}
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
                                                                        <input className="form-check-input"
                                                                               type="checkbox"
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

                                                    <div className="my-2">
                                                        <h6>Комментарий:</h6>
                                                        <textarea type="text" className="form-control"
                                                                  name="comment"
                                                                  value={mark.criteriaMarks.find(criteriaMark => criteriaMark.criteriaId === criteria.id)?.comment || ''}
                                                                  onChange={(e) => handleCommentChange(e, criteria.id)}/>
                                                    </div>

                                                </div>
                                            ))}

                                            <div className="d-flex mb-2 align-items-center">
                                                <label className="me-2 fw-semibold fs-5 w-auto">Итоговая
                                                    оценка:</label>
                                                <span
                                                    className="form-control-plaintext fs-5 w-auto text-wrap">{mark?.mark}</span>
                                            </div>

                                            <div className="my-2">
                                                <h6>Общий комментарий:</h6>
                                                <textarea type="text" className="form-control" name="comment"
                                                          value={mark.comment}
                                                          onChange={(e) => handleCommentChange(e, null)}/>
                                            </div>
                                        </form>
                                    </div>

                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-light" data-bs-dismiss="modal"
                                                onClick={handleClose}>Отмена
                                        </button>
                                        <button type="button" className="btn btn-primary"
                                                onClick={handleSubmit}>Сохранить
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
        </>
    );
}

