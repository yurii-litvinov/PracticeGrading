import React, {useRef, useState, useEffect} from 'react';
import {StudentWork} from '../interfaces/StudentWork'

/**
 * Interface for student work modal props.
 *
 * @param studentWorkData - Student work to edit
 * @param onSave - Save student work function
 */
interface StudentWorkModalProps {
    studentWorkData: StudentWork,
    onSave: (studentWork: StudentWork) => void,
}

export function StudentWorkModal({studentWorkData, onSave}: StudentWorkModalProps) {
    const formRef = useRef();
    const closeButtonRef = useRef();

    const initialStudentWorkState: StudentWork = {
        studentName: '',
        theme: '',
        supervisor: '',
        consultant: '',
        reviewer: '',
        supervisorMark: undefined,
        reviewerMark: undefined,
        codeLink: ''
    }

    const [studentWork, setStudentWork] = useState(initialStudentWorkState);

    useEffect(() => {
        if (studentWorkData) {
            setStudentWork(studentWorkData);
        } else {
            setStudentWork(initialStudentWorkState);
        }
    }, [studentWorkData]);
    
    const handleChange = (e) => {
        const {name, value} = e.target;

        setStudentWork((prev) => ({
            ...prev,
            [name]: value === '' ? null : value
        }));
    }

    const handleSave = () => {
        if (formRef.current && !formRef.current.checkValidity()) {
            formRef.current.reportValidity();
            return;
        }

        onSave(studentWork);
        setStudentWork(studentWorkData ?? initialStudentWorkState);

        if (closeButtonRef.current) {
            closeButtonRef.current.click();
        }
    }

    const handleClose = () => {
        setStudentWork(studentWorkData ?? initialStudentWorkState);
    }

    return (
        <div className="modal fade" id="studentWorkModal" data-bs-backdrop="static" data-bs-keyboard="false"
             tabIndex="-1"
             aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1 className="modal-title fs-5 ps-4"
                            id="staticBackdropLabel">{studentWorkData ? "Редактирование студенческой работы" : "Создание студенческой работы"}</h1>
                        <button type="button" className="btn-close" ref={closeButtonRef} data-bs-dismiss="modal"
                                aria-label="Close" onClick={handleClose}></button>
                    </div>

                    <div className="modal-body">
                        <form ref={formRef} className="px-4">
                            <div className="mb-2">
                                <label className="form-label">ФИО студента</label>
                                <input type="text" className="form-control" name="studentName"
                                       required value={studentWork.studentName} onChange={handleChange}/>
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Тема практики/ВКР</label>
                                <input type="text" className="form-control" name="theme"
                                       required value={studentWork.theme} onChange={handleChange}/>
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Научный руководитель</label>
                                <input type="text" className="form-control" name="supervisor"
                                       required value={studentWork.supervisor} onChange={handleChange}/>
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Консультант</label>
                                <input type="text" className="form-control" name="consultant"
                                       value={studentWork.consultant} onChange={handleChange}/>
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Рецензент</label>
                                <input type="text" className="form-control" name="reviewer"
                                       value={studentWork.reviewer} onChange={handleChange}/>
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Ссылка на код</label>
                                <input type="url" className="form-control" name="codeLink"
                                       value={studentWork.codeLink === 0 ? null : studentWork.codeLink}
                                       onChange={handleChange}/>
                            </div>
                            <div className="row">
                                <div className="col-6 d-flex align-items-center">
                                    <label className="form-label me-3">Оценка научного
                                        руководителя</label>
                                    <input type="number" className="form-control w-auto" name="supervisorMark"
                                           min="2" max="5" step="1"
                                           value={studentWork.supervisorMark ?? ''} onChange={handleChange}/>
                                </div>
                                <div className="col-6 d-flex align-items-center">
                                    <label className="form-label me-3">Оценка
                                        рецензента</label>
                                    <input type="number" className="form-control w-auto" name="reviewerMark"
                                           min="2" max="5" step="1"
                                           value={studentWork.reviewerMark ?? ''} onChange={handleChange}/>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-light" data-bs-dismiss="modal"
                                onClick={handleClose}>Отмена
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleSave}>Сохранить</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
