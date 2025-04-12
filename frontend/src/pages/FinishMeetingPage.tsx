import React, {useEffect, useState, useRef} from 'react';
import {useParams} from 'react-router-dom';
import {getMeetings, uploadTheses, getMarkTable, getMarkTableForStudents} from '../services/ApiService';
import {TypeOptions, CourseOptions} from '../models/ThesisOptions';
import {format} from 'date-fns';

export function FinishMeetingPage() {
    const {id} = useParams();
    const [works, setWorks] = useState([]);
    const [thesisInfos, setThesisInfos] = useState([]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploaded, setUploaded] = useState([]);
    const formRef = useRef();
    const [filename, setFileName] = useState('');

    useEffect(() => {
        if (id) {
            getMeetings(id).then(response => {
                const meeting = response.data[0];
                const year = new Date(meeting.dateAndTime).getFullYear();
                const filteredWorks = meeting.studentWorks.filter(work =>
                    ["A", "B", "C", "D", "E", "5", "4", "3"].includes(work.finalMark)
                );

                const infos = filteredWorks.map(work => ({
                    id: work.id,
                    type_id: '',
                    course_id: '',
                    name_ru: work.theme,
                    author: work.studentName,
                    source_uri: work.codeLink,
                    supervisor: work.supervisor,
                    publish_year: year,
                    secret_key: ''
                }));

                setFileName(meeting.info + ", " + format(new Date(meeting.dateAndTime), 'dd.MM.yyyy'))
                setThesisInfos(infos);
                setWorks(filteredWorks);
                setUploaded([]);
            });
        }
    }, [id]);

    const handleBack = () => {
        window.history.back();
    }

    const handleLoad = async () => {
        if (formRef.current && !formRef.current.checkValidity()) {
            formRef.current.reportValidity();
            return;
        }

        if (thesisInfos.some(thesis => thesis.type_id === '' || thesis.course_id === '')) {
            alert('Пожалуйста, укажите тип работы и направление обучения для каждого студента.')
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            for (const file of files) {
                formData.append('fileCollection', file);
            }
            formData.append('thesisInfosString', JSON.stringify(thesisInfos.map(({id, ...rest}) => rest)));

            const response = await uploadTheses(formData);
            setUploaded(response.data);
        } catch {
            alert('Что-то пошло не так.');
        } finally {
            setLoading(false);
        }
    }

    const handleDownload = async () => {
        const response = await getMarkTable(id);
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename + ".xlsx";

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    const handleDownloadForStudents = async () => {
        const response = await getMarkTableForStudents(id);
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename + " (для студентов).xlsx";

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    return (
        <>
            <div className="d-flex flex-column flex-sm-row align-items-start justify-content-end w-100">
                <h2 className="me-auto w-100 mb-3 mb-sm-0 text-center text-sm-start">Завершение заседания</h2>
                <div className="d-flex flex-column flex-sm-row justify-content-end w-100">
                    <button type="button" className="btn btn-light btn-lg mb-2 mb-sm-0 me-sm-2"
                            onClick={handleBack}>Назад
                    </button>
                </div>
            </div>

            <hr className="my-4"/>

            <div className="p-2">
                <h5>Загрузка работ на сайт кафедры СП</h5>
                <p> Выберите файлы с текстами работ, отзывами
                    рецензентов
                    или консультантов и презентациями (если они есть), укажите ключ для доступа к API, а также тип
                    работы и
                    направление обучения для каждого студента.</p>
            </div>

            <form ref={formRef}>
                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Файлы</label>
                    <input className="form-control"
                           required
                           multiple
                           type="file"
                           onChange={(e) => setFiles(e.target.files)}
                    />
                </div>
                <div className="d-flex mb-2 align-items-center">
                    <label className="me-3 fw-bold text-end label-custom">Ключ доступа к API</label>
                    <input className="form-control"
                           value={thesisInfos[0]?.secret_key || ""}
                           required
                           type="text"
                           onChange={(e) => setThesisInfos(prevInfos =>
                               prevInfos.map(thesis => ({
                                   ...thesis,
                                   secret_key: e.target.value
                               }))
                           )}
                    />
                </div>
            </form>

            <div>
                <h4 className="p-2">Список успешно защитившихся студентов</h4>

                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                        <tr>
                            <th>ФИО</th>
                            {works.some((work) => work.info) ?
                                (<th>Курс, направление</th>) : (<></>)}
                            <th>Тема</th>
                            <th>Научник</th>
                            {works.some((work) => work.consultant) ? (
                                <th>Консультант</th>) : (<></>)}
                            {works.some((work) => work.reviewer) ? (
                                <th>Рецензент</th>) : (<></>)}
                            {works.some((work) => work.codeLink) ?
                                (<th>Код</th>) : (<></>)}
                            <th>Оценка</th>
                            <th>Тип работы</th>
                            <th>Направление</th>
                        </tr>
                        </thead>
                        <tbody> {works.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center">Успешно защищенные работы отсутствуют</td>
                            </tr>
                        ) : (
                            works.map((work) => (
                                <tr key={work.id}>
                                    <td>{work.studentName}</td>
                                    {works.some((work) => work.info) ?
                                        (<td>{work.info || "—"}</td>) : (<></>)}
                                    <td style={{maxWidth: '600px'}}>{work.theme}</td>
                                    <td>{work.supervisor}</td>
                                    {works.some((work) => work.consultant) ? (
                                        <td>{work.consultant || "—"}</td>) : (<></>)}
                                    {works.some((work) => work.reviewer) ?
                                        (<td>{work.reviewer || "—"}</td>) : (<></>)}
                                    {works.some((work) => work.codeLink) ?
                                        (<td style={{minWidth: '87px'}}>{work.codeLink ? (
                                            work.codeLink !== 'NDA' ? (
                                                work.codeLink.split(' ').map((link, linkIndex) => (
                                                    <div key={linkIndex} className="mb-2">
                                                        <a href={link} target="_blank"
                                                           rel="noopener noreferrer">
                                                            Ссылка {work.codeLink.split(' ').length > 1 ? linkIndex + 1 : ''}
                                                        </a>
                                                    </div>
                                                ))
                                            ) : (<span className="fst-italic">NDA</span>)
                                        ) : (
                                            <span>—</span>
                                        )}</td>) : (<></>)}
                                    <td>{work.finalMark}</td>
                                    <td>
                                        <select className="form-select w-auto"
                                                value={thesisInfos.find(thesis => thesis.id === work.id)?.type_id || ""}
                                                onChange={(e) => {
                                                    setThesisInfos(prev => prev.map(thesis =>
                                                        thesis.id === work.id
                                                            ? {...thesis, type_id: Number(e.target.value)}
                                                            : thesis
                                                    ));
                                                }}>
                                            <option value="" disabled>Выберите тип работы</option>
                                            {TypeOptions.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        <select className="form-select w-auto"
                                                value={thesisInfos.find(thesis => thesis.id === work.id)?.course_id || ""}
                                                onChange={(e) => {
                                                    setThesisInfos(prev => prev.map(thesis =>
                                                        thesis.id === work.id
                                                            ? {...thesis, course_id: Number(e.target.value)}
                                                            : thesis
                                                    ));
                                                }}>
                                            <option value="" disabled>Выберите направление обучения</option>
                                            {CourseOptions.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                </div>

                {uploaded.length !== 0 ? (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        <h5 class="alert-heading">Загрузка завершена!</h5>
                        <p>Были загружены работы следующих студентов:</p>
                        <div className="ps-3">
                            <ol>
                                {uploaded.map((student, index) => (
                                    <li key={index}>
                                        {student}
                                    </li>
                                ))}
                            </ol>
                        </div>

                        <p>
                            Вы можете подтвердить работы{' '}
                            <a href="https://se.math.spbu.ru/theses_tmp.html" target="_blank" rel="noopener noreferrer">
                                здесь
                            </a>.
                        </p>
                        <button type="button" className="btn-close" aria-label="Close"
                                onClick={(e) => setUploaded([])}></button>
                    </div>
                ) : (<></>)}

                <div className="d-flex flex-column flex-sm-row justify-content-end w-100">
                    {loading ? (
                        <button type="button" className="btn btn-primary btn-lg mb-2 mb-sm-0 me-sm-2" disabled>
                            <span className="spinner-border me-2" style={{width: '1.4rem', height: '1.4rem'}}
                                  aria-hidden="true"></span>
                            Загрузка...
                        </button>
                    ) : (
                        <button type="button" className="btn btn-primary btn-lg mb-2 mb-sm-0 me-sm-2"
                                onClick={handleLoad}>Загрузить
                        </button>
                    )}
                </div>

                <hr className="my-4"/>

                <div className="p-2">
                    <h5>Скачивание таблицы с оценками</h5>
                    <p> Полученная .xlsx-таблица содержит оценки, выставленные членами комиссии, средние оценки и
                        итоговую оценку каждой работы.</p>
                    <p> Таблица для студентов не содержит оценок членов комиссии.</p>
                </div>
                <div className="d-flex flex-column flex-sm-row justify-content-end w-100">
                    <button type="button" className="btn btn-outline-primary btn-lg mb-2 mb-sm-0 me-sm-2"
                            onClick={handleDownloadForStudents}>Скачать версию для студентов
                    </button>
                    <button type="button" className="btn btn-primary btn-lg mb-2 mb-sm-0 me-sm-2"
                            onClick={handleDownload}>Скачать
                    </button>
                </div>
            </div>
        </>
    );
}

