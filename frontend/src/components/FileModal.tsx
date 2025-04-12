import {useRef, useState, useEffect} from 'react';
import {FormatTable} from './FormatTable'
import {DataFields} from '../models/DataFields'
import {createMeetingsFromFile} from '../services/ApiService';

export function FileModal({onSubmit}) {
    const formRef = useRef();
    const closeButtonRef = useRef();
    const [file, setFile] = useState(null);
    const [separator, setSeparator] = useState(null);
    const [headers, setHeaders] = useState(null);
    const [membersColumn, setMembersColumn] = useState(0);
    const [type, setType] = useState("practice");

    const formatRows = (rows) => {
        const filteredRows = rows.filter((row) =>
            !row.every((cell) => JSON.stringify(cell) === JSON.stringify([DataFields.Empty])));
        const filteredCells = filteredRows.map((row) => {
            let lastNonEmptyIndex = row.length - 1;
            while (lastNonEmptyIndex >= 0 && JSON.stringify(row[lastNonEmptyIndex]) === JSON.stringify([DataFields.Empty])) {
                lastNonEmptyIndex--;
            }

            return row.slice(0, lastNonEmptyIndex + 1);
        });
        return filteredCells.map((row) => row.map((cell) => cell.map((item) => item[1]).join(", ")))
    }

    const handleSeparatorChange = (rows) => {
        setSeparator(formatRows(rows));
    }

    const handleHeadersChange = (rows) => {
        setHeaders(formatRows(rows)[0]);
    }

    const handleSubmit = async () => {
        if (formRef.current && !formRef.current.checkValidity()) {
            formRef.current.reportValidity();
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('headers', JSON.stringify(headers));
            formData.append('separator', JSON.stringify(separator));
            formData.append('membersColumn', membersColumn - 1);
            await createMeetingsFromFile(formData);
            onSubmit();

            if (closeButtonRef.current) {
                closeButtonRef.current.click();
            }
        } catch {
            alert('Что-то пошло не так. Пожалуйста, проверьте формат таблицы.');
        }
    };

    return (
        <div className="modal fade" id="fileModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1"
             aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1 className="modal-title fs-4 ps-4"
                            id="staticBackdropLabel">Загрузить заседания из файла</h1>
                        <button type="button" className="btn-close" ref={closeButtonRef} data-bs-dismiss="modal"
                                aria-label="Close"></button>
                    </div>

                    <div className="modal-body">
                        <div className="px-4">
                            <form ref={formRef}>
                                <h5 className="form-label">Файл с расписанием заседаний</h5>
                                <input className="form-control"
                                       required
                                       type="file" accept=".xlsx"
                                       onChange={(e) => setFile(e.target.files[0])}
                                />
                            </form>

                            <hr className="my-4"/>
                            <h5 className="form-label">Тип защит</h5>
                            <div className="form-check form-check-inline">
                                <input className="form-check-input" type="radio" checked={type === "practice"}
                                       id="inlineRadio1"
                                       onChange={() => {
                                           setType("practice");
                                           setMembersColumn(0);
                                       }}/>
                                <label className="form-check-label" htmlFor="inlineRadio1">Защиты практик</label>
                            </div>
                            <div className="form-check form-check-inline">
                                <input className="form-check-input" type="radio" checked={type === "vkr"}
                                       id="inlineRadio2"
                                       onChange={() => {
                                           setType("vkr");
                                           setMembersColumn(7);
                                       }}/>
                                <label className="form-check-label" htmlFor="inlineRadio2">Защиты ВКР</label>
                            </div>

                            <hr className="my-4"/>

                            <h5 className="form-label">Формат таблицы</h5>
                            <p>Укажите формат разделителя заседаний и данных о работах студентов. В каждой ячейке
                                выберите
                                из
                                выпадающего меню необходимые поля. Если ячейка должна быть пустой — ничего не
                                выбирайте.
                                Поля, содержащиеся в одной ячейке, должны быть разделены запятой. Для удаления поля
                                нажмите
                                на него и выберите вариант «Удалить». Пустые строки будут проигнорированы.</p>

                            {type === "practice" ? (
                                <>
                                    <h6 className="form-label mb-4">Разделитель заседаний</h6>
                                    <FormatTable dataFields={[
                                        DataFields.Date,
                                        DataFields.Time,
                                        DataFields.Auditorium,
                                        DataFields.Info,
                                        DataFields.CallLink
                                    ]} initialRowsState={[
                                        [[DataFields.Empty], [DataFields.Empty], [DataFields.Date, DataFields.Time, DataFields.Auditorium], [DataFields.CallLink]],
                                        [[DataFields.Empty], [DataFields.Empty], [DataFields.Info], [DataFields.Empty]]
                                    ]} onChange={handleSeparatorChange}/>

                                    <h6 className="form-label pt-3 mb-4">Данные о работах студентов</h6>
                                    <FormatTable dataFields={[
                                        DataFields.StudentName,
                                        DataFields.StudentInfo,
                                        DataFields.Theme,
                                        DataFields.Supervisor,
                                        DataFields.Consultant,
                                        DataFields.Reviewer
                                    ]} initialRowsState={[
                                        [[DataFields.Empty], [DataFields.Empty], [DataFields.StudentName], [DataFields.StudentInfo], [DataFields.Theme], [DataFields.Supervisor]]
                                    ]} onChange={handleHeadersChange}/>
                                </>) : (
                                <>
                                    <div className="d-flex align-items-center mb-4">
                                        <h6 className="form-label mb-0 me-2">Номер колонки с членами комиссии:</h6>
                                        <input
                                            type="number"
                                            className="form-control"
                                            style={{maxWidth: '65px'}}
                                            value={membersColumn}
                                            onChange={(e) => setMembersColumn(e.target.value)}
                                            placeholder="0"
                                        />
                                    </div>


                                    <h6 className="form-label mb-4">Разделитель заседаний</h6>
                                    <FormatTable dataFields={[
                                        DataFields.Date,
                                        DataFields.Time,
                                        DataFields.Auditorium,
                                        DataFields.Info,
                                        DataFields.CallLink
                                    ]} initialRowsState={[
                                        [[DataFields.Empty], [DataFields.Date], [DataFields.Empty]],
                                        [[DataFields.Empty], [DataFields.Time, DataFields.Auditorium], [DataFields.Info]]
                                    ]} onChange={handleSeparatorChange}/>

                                    <h6 className="form-label pt-3 mb-4">Данные о работах студентов</h6>
                                    <FormatTable dataFields={[
                                        DataFields.StudentName,
                                        DataFields.StudentInfo,
                                        DataFields.Theme,
                                        DataFields.Supervisor,
                                        DataFields.Consultant,
                                        DataFields.Reviewer
                                    ]} initialRowsState={[
                                        [[DataFields.Empty], [DataFields.StudentName], [DataFields.Theme], [DataFields.Supervisor], [DataFields.Reviewer]]
                                    ]} onChange={handleHeadersChange}/>
                                </>)}

                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-light" data-bs-dismiss="modal">Отмена
                        </button>
                        <button type="button" className="btn btn-primary"
                                onClick={handleSubmit}>Сохранить
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
        ;
}
