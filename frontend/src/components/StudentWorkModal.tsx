import { useRef, useState, useEffect } from 'react';
import { StudentWork } from '../models/StudentWork'

/**
 * Interface for student work modal props.
 *
 * @param studentWorkData - Student work to edit
 * @param onSave - Save student work function
 */
interface StudentWorkModalProps {
    studentWorkData?: StudentWork,
    onSave: (studentWork: StudentWork) => void,
}

export function StudentWorkModal({ studentWorkData, onSave }: StudentWorkModalProps) {
    const formRef = useRef<HTMLFormElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const [codeLinks, setCodeLinks] = useState(['']);

    const initialStudentWorkState: StudentWork = {
        studentName: '',
        info: '',
        theme: '',
        supervisor: '',
        consultant: '',
        reviewer: '',
        supervisorMark: undefined,
        reviewerMark: undefined,
        codeLink: '',
        finalMark: '',
        reportLink: '',
        supervisorReviewLink: '',
        consultantReviewLink: '',
        reviewerReviewLink: '',
        additionalLink: '',
        averageCriteriaMarks: []
    }

    const [studentWork, setStudentWork] = useState(initialStudentWorkState);

    useEffect(() => {
        if (studentWorkData) {
            setStudentWork(studentWorkData);
            const links = studentWorkData.codeLink ? studentWorkData.codeLink.split(' ') : [''];
            if (links[0] !== 'NDA') {
                setCodeLinks(links);
            }
        } else {
            setStudentWork(initialStudentWorkState);
        }
    }, [studentWorkData]);

    const handleChange = (e: { target: { name: any; value: any; }; }) => {
        const { name, value } = e.target;

        setStudentWork((prev) => ({
            ...prev,
            [name]: value === '' ? null : value
        }));
    }

    useEffect(() => {
        if (codeLinks.length > 0 && codeLinks[codeLinks.length - 1] !== '') {
            setCodeLinks([...codeLinks, '']);
        }
    }, [codeLinks]);

    const handleLinksChange = (index: number, value: string) => {
        const updatedLinks = [...codeLinks];
        updatedLinks[index] = value;

        if (value === '') {
            updatedLinks.splice(index, 1);
        }

        setCodeLinks(updatedLinks);
    }

    const handleSave = () => {
        if (formRef.current && !formRef.current.checkValidity()) {
            formRef.current.reportValidity();
            return;
        }

        if (studentWork.codeLink !== 'NDA') {
            studentWork.codeLink = codeLinks.join(' ').trim();
        }
        onSave(studentWork);
        setStudentWork(studentWorkData ?? initialStudentWorkState);
        setCodeLinks(['']);

        if (closeButtonRef.current) {
            closeButtonRef.current.click();
        }
    }

    const handleClose = () => {
        setStudentWork(studentWorkData ?? initialStudentWorkState);
        setCodeLinks(['']);
    }

    const handleCheck = (e: { target: { checked: any; }; }) => {
        setStudentWork((prev) => ({
            ...prev,
            codeLink: e.target.checked ? 'NDA' : codeLinks.join(' ')
        }));
    }

    return (
        <div className="modal fade" id="studentWorkModal" data-bs-backdrop="static" data-bs-keyboard="false"
            tabIndex={-1}
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
                                    required value={studentWork.studentName} onChange={handleChange} />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Курс, направление</label>
                                <input type="text" className="form-control" name="info"
                                    value={studentWork.info} onChange={handleChange} />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Тема практики/ВКР</label>
                                <input type="text" className="form-control" name="theme"
                                    required value={studentWork.theme} onChange={handleChange} />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Научный руководитель</label>
                                <input type="text" className="form-control" name="supervisor"
                                    required value={studentWork.supervisor} onChange={handleChange} />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Информация о научном руководителе</label>
                                <textarea
                                    className="form-control"
                                    name="supervisorInfo"
                                    rows={3}
                                    value={studentWork.supervisorInfo ?? ''}
                                    onChange={handleChange}
                                    placeholder="Учёная степень, учёное звание, должность" />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Консультант</label>
                                <input type="text" className="form-control" name="consultant"
                                    value={studentWork.consultant} onChange={handleChange} />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Рецензент</label>
                                <input type="text" className="form-control" name="reviewer"
                                    value={studentWork.reviewer} onChange={handleChange} />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Информация о рецензенте</label>
                                <textarea
                                    className="form-control"
                                    name="reviewerInfo"
                                    rows={3}
                                    value={studentWork.reviewerInfo ?? ''}
                                    onChange={handleChange}
                                    placeholder="Учёная степень, учёное звание, должность" />
                            </div>
                            <div className="mb-2">
                                <div className="d-flex justify-content-between align-items-center">
                                    <label className="form-label">Ссылка на код</label>
                                    <div className="form-check">
                                        <input type="checkbox" className="form-check-input" id="ndaCheck"
                                            checked={studentWork.codeLink === 'NDA'}
                                            onChange={handleCheck} />
                                        <label className="form-check-label" htmlFor="ndaCheck">NDA</label>
                                    </div>
                                </div>
                                {studentWork.codeLink === 'NDA' ? (<></>) :
                                    (codeLinks.map((link, index) => (
                                        <div key={index} className="mb-3">
                                            <input
                                                type="url"
                                                className="form-control"
                                                value={link}
                                                onChange={(e) => handleLinksChange(index, e.target.value)} />
                                        </div>
                                    )))
                                }
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Оценка научного руководителя</label>
                                <input type="text" className="form-control" name="supervisorMark"
                                    value={studentWork.supervisorMark ?? ''} onChange={handleChange} />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Оценка рецензента</label>
                                <input type="text" className="form-control" name="reviewerMark"
                                    value={studentWork.reviewerMark ?? ''} onChange={handleChange} />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Ссылка на отчёт</label>
                                <input type="url" className="form-control" name="reportLink"
                                    value={studentWork.reportLink ?? ''} onChange={handleChange} />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Ссылка на отзыв научника</label>
                                <input type="url" className="form-control" name="supervisorReviewLink"
                                    value={studentWork.supervisorReviewLink ?? ''} onChange={handleChange} />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Ссылка на отзыв консультанта</label>
                                <input type="url" className="form-control" name="consultantReviewLink"
                                    value={studentWork.consultantReviewLink ?? ''} onChange={handleChange} />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Ссылка на рецензию</label>
                                <input type="url" className="form-control" name="reviewerReviewLink"
                                    value={studentWork.reviewerReviewLink ?? ''} onChange={handleChange} />
                            </div>
                            <div className="mb-2">
                                <label className="form-label">Ссылка на дополнительные материалы</label>
                                <input type="url" className="form-control" name="additionalLink"
                                    value={studentWork.additionalLink ?? ''} onChange={handleChange} />
                            </div>
                        </form>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-light" data-bs-dismiss="modal"
                            onClick={handleClose}>Отмена
                        </button>
                        <button type="button" className="btn btn-primary" id="save-student"
                            onClick={handleSave}>Сохранить
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
