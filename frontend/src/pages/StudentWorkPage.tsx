import React, {useEffect, useState, useRef} from 'react';
import {useParams} from 'react-router-dom';
import {
    getMeetings,
    getMemberMarks,
    createMemberMark,
    updateMemberMark,
    deleteMemberMark
} from '../services/ApiService';
import 'react-datepicker/dist/react-datepicker.css';
import {SignalRService} from '../services/SignalRService';
import {Actions} from '../models/Actions';
import {jwtDecode} from "jwt-decode";
import {Criteria} from "../models/Criteria"
import {StudentWork} from "../models/StudentWork"
import {MemberMark} from "../models/MemberMark"
import {RuleTypes} from '../models/RuleTypes'
import {MemberMarkForm} from '../components/MemberMarkForm'
import {MemberMarkCard} from '../components/MemberMarkCard'

export function StudentWorkPage() {
    const {meetingId, workId} = useParams();
    const [criteria, setCriteria] = useState<Criteria[]>([]);
    const [studentWork, setStudentWork] = useState<StudentWork>();
    const [otherMarks, setOtherMarks] = useState<MemberMark[]>([]);
    const [otherMembers, setOtherMembers] = useState<any[]>([]);
    const [isChanged, setIsChanged] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const typeOrder: { [key: string]: number } = {
        [RuleTypes.Fixed]: 1,
        [RuleTypes.Range]: 2,
        [RuleTypes.Custom]: 3
    };

    const token = sessionStorage.getItem('token');
    let name = '';
    let id = '';
    let role = '';
    if (token) {
        const decoded = jwtDecode(token);
        // @ts-ignore
        name = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
        // @ts-ignore
        id = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]
        // @ts-ignore
        role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    }

    const initialMarkState: MemberMark = {
        id: undefined,
        memberId: Number(id),
        studentWorkId: Number(workId),
        criteriaMarks: [],
        mark: 0,
        comment: ''
    }

    const [mark, setMark] = useState(initialMarkState);
    const signalRService = useRef<SignalRService | null>(null);

    const fetchData = () => {
        getMeetings(Number(meetingId)).then(response => {
            const meeting = response.data[0]
            const criteriaList = meeting.criteria;

            setStudentWork(meeting.studentWorks.find(((student: StudentWork) => student.id == Number(workId))));
            setOtherMembers(meeting.members.filter((member: { id: number; }) => member.id != Number(id)));

            setCriteria(
                criteriaList.map((criteria: Criteria) => ({
                    ...criteria,
                    scale: criteria.scale.sort((a, b) => b.value! - a.value!),
                    rules: criteria.rules.sort((a, b) => {
                        if (a.type && b.type && typeOrder[a.type] !== typeOrder[b.type]) {
                            return typeOrder[a.type] - typeOrder[b.type];
                        }
                        return b.value! - a.value!;
                    })
                }))
            );
        });

        getMemberMarks(Number(workId)).then(response => {
            const marks = response.data;
            const targetMark = marks.find((mark: MemberMark) => mark.memberId == Number(id));
            const otherMarks = marks.filter((mark: MemberMark) => mark.memberId != Number(id));

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
                    id: undefined,
                    memberMarkId: prevMark.memberId,
                    criteriaId: element.id!,
                    selectedRules: [],
                    mark: undefined,
                }))
            }));
        }
    }, [criteria, mark.id]);

    useEffect(() => {
        if (workId) {
            fetchData();

            signalRService.current = new SignalRService(meetingId!, handleNotification);
            signalRService.current.startConnection();
        }

        return () => {
            if (signalRService.current) signalRService.current.stopConnection();
            signalRService.current = null;
        }
    }, [workId]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        saveMark();
    }

    const saveMark = () => {
        if (role === 'member') {
            if (mark?.id == null || mark.id === 0) {
                createMemberMark(mark).then(() => signalRService.current?.sendNotification(Actions.SendMark));
            } else {
                updateMemberMark(mark).then(() => signalRService.current?.sendNotification(Actions.SendMark));
            }
        } else {
            updateMemberMark(mark).then(() => signalRService.current?.sendNotification(Actions.SendMark));
            closeButtonRef.current?.click();
        }
    }

    const handleBack = () => {
        window.history.back();
    }

    const handleDeleteMark = async (memberId: number) => {
        const isConfirmed = window.confirm('Вы уверены, что хотите удалить эту оценку?');
        if (isConfirmed) {
            await deleteMemberMark(Number(workId), memberId);
            signalRService.current?.sendNotification(Actions.Update);
        }
    }

    const handleClose = () => {
        setMark(initialMarkState);
        signalRService.current?.sendNotification(Actions.Update);
    }

    return (
        <>
            <div className="d-flex flex-column p-2">
                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">ФИО студента</label>
                    <span
                        className="form-control-plaintext text-wrap span-custom">{studentWork?.studentName}</span>
                </div>

                {studentWork?.info ? (<div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Курс, направление</label>
                    <span
                        className="form-control-plaintext text-wrap span-custom">{studentWork?.info}</span>
                </div>) : (<></>)}

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Тема практики/ВКР</label>
                    <span className="form-control-plaintext text-wrap span-custom">{studentWork?.theme}</span>
                </div>

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Научный руководитель</label>
                    <span
                        className="form-control-plaintext text-wrap span-custom">{studentWork?.supervisor}</span>
                </div>

                {studentWork?.consultant ? (<div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Консультант</label>
                    <span
                        className="form-control-plaintext text-wrap span-custom">{studentWork?.consultant}</span>
                </div>) : (<></>)}

                {studentWork?.reviewer ? (<div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Рецензент</label>
                    <span
                        className="form-control-plaintext text-wrap span-custom">{studentWork?.reviewer || "—"}</span>
                </div>) : (<></>)}

                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Оценка научного руководителя</label>
                    <span
                        className="form-control-plaintext w-auto text-wrap">{studentWork?.supervisorMark || "—"}</span>
                </div>

                {studentWork?.reviewerMark ? (<div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Оценка рецензента</label>
                    <span
                        className="form-control-plaintext w-auto text-wrap">{studentWork?.reviewerMark || "—"}</span>
                </div>) : (<></>)}

                {studentWork?.codeLink ? (<div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Код</label>
                    <span className="form-control-plaintext w-auto text-wrap">{studentWork?.codeLink !== 'NDA' ? (
                        studentWork.codeLink.split(' ').map((link, linkIndex) => (
                            <div key={linkIndex} className="mb-2">
                                <a href={link} target="_blank" rel="noopener noreferrer">
                                    Ссылка {studentWork?.codeLink && studentWork?.codeLink.split(' ').length > 1 ? linkIndex + 1 : ''}
                                </a>
                            </div>
                        ))
                    ) : (
                        <span className="fst-italic">NDA</span>
                    )}</span>
                </div>) : (<></>)}

                {studentWork?.reportLink ? (<div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Отчёт</label>
                    <span
                        className="form-control-plaintext w-auto text-wrap">
                        <a href={studentWork.reportLink} target="_blank" rel="noopener noreferrer">Ссылка</a></span>
                </div>) : (<></>)}

                {studentWork?.supervisorReviewLink ? (<div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Отзыв научника</label>
                    <span
                        className="form-control-plaintext w-auto text-wrap">
                        <a href={studentWork.supervisorReviewLink} target="_blank" rel="noopener noreferrer">Ссылка</a></span>
                </div>) : (<></>)}

                {studentWork?.consultantReviewLink ? (<div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Отзыв консультанта</label>
                    <span
                        className="form-control-plaintext w-auto text-wrap">
                        <a href={studentWork?.consultantReviewLink} target="_blank" rel="noopener noreferrer">Ссылка</a></span>
                </div>) : (<></>)}

                {studentWork?.reviewerReviewLink ? (<div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Рецензия</label>
                    <span
                        className="form-control-plaintext w-auto text-wrap">
                        <a href={studentWork.reviewerReviewLink} target="_blank"
                           rel="noopener noreferrer">Ссылка</a></span>
                </div>) : (<></>)}

                {studentWork?.additionalLink ? (<div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Дополнительные материалы</label>
                    <span
                        className="form-control-plaintext w-auto text-wrap">
                        <a href={studentWork.additionalLink} target="_blank" rel="noopener noreferrer">Ссылка</a></span>
                </div>) : (<></>)}

            </div>

            {role === 'member' ? (<>
                    <div className="card w-auto mb-4">
                        <div className="card-body p-4">
                            <h4 className="card-title text-center mb-2">Моя оценка</h4>
                            <hr className="my-4"/>
                            <MemberMarkForm role={role} name={name}
                                            criteria={criteria} isChanged={isChanged} setIsChanged={setIsChanged}
                                            mark={mark}
                                            setMark={setMark} saveMark={saveMark}/>
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
                    <MemberMarkCard role={role} otherMarks={otherMarks} otherMembers={otherMembers} criteria={criteria}/>
                </>)

                : (<>
                        <div className="d-flex flex-column flex-sm-row align-items-start justify-content-end w-100">
                            <div className="d-flex flex-column flex-sm-row justify-content-end w-100">
                                <button type="button" className="btn btn-light btn-lg mb-2 mb-sm-0 me-sm-2"
                                        onClick={handleBack}>Назад к заседанию
                                </button>
                            </div>
                        </div>

                        <hr className="mb-4"/>

                        <h4 className="mb-4">Оценки членов комиссии</h4>
                        <MemberMarkCard role={role} otherMarks={otherMarks} otherMembers={otherMembers}
                                        criteria={criteria} handleDeleteMark={handleDeleteMark} setMark={setMark}/>

                        <div className="modal fade" id="markModal" data-bs-backdrop="static"
                             data-bs-keyboard="false"
                             tabIndex={-1}
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
                                        <div className="px-4">
                                            <MemberMarkForm role={role}
                                                            name={otherMembers?.find(member => member.id === mark.memberId)?.name}
                                                            criteria={criteria} isChanged={isChanged}
                                                            setIsChanged={setIsChanged}
                                                            mark={mark}
                                                            setMark={setMark} saveMark={saveMark}/>
                                        </div>
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

