import {useRef, useState, useEffect} from 'react';
import {getDocuments} from '../services/ApiService';

export function DocumentsModel({meeting}) {
    const formRef = useRef();
    const closeButtonRef = useRef();
    const [coordinators, setCoordinators] = useState(['']);
    const [chairman, setChairman] = useState('');

    useEffect(() => {
        if (meeting.members.length > 0) {
            setChairman(meeting.members[0].name);
        }
    }, [meeting]);

    useEffect(() => {
        if (coordinators.length > 0 && coordinators[coordinators.length - 1] !== '') {
            setCoordinators((prev) => ([...prev, '']))
        }
    }, [coordinators]);

    const handleCoordinatorsChange = (index: number, value: string) => {
        const updated = [...coordinators];
        updated[index] = value;

        if (value === '') {
            updated.splice(index, 1);
        }

        setCoordinators(updated);
    }

    const handleDownload = async () => {
        const coordinatorsString = coordinators.slice(0, -1);

        if (formRef.current && coordinatorsString.length === 0) {
            formRef.current.reportValidity();
            return;
        }

        const response = await getDocuments(meeting.id, coordinatorsString.join(",\n"), chairman);
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = "Документы.zip";

        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        if (closeButtonRef.current) {
            closeButtonRef.current.click();
        }
    };

    return (
        <div className="modal fade" id="docsModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex="-1"
             aria-labelledby="staticBackdropLabel" aria-hidden="true">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1 className="modal-title fs-4 ps-4"
                            id="staticBackdropLabel">Сгенерировать документы для заседания</h1>
                        <button type="button" className="btn-close" ref={closeButtonRef} data-bs-dismiss="modal"
                                aria-label="Close"></button>
                    </div>

                    <div className="modal-body px-4">
                        <form ref={formRef} className="px-4">
                            <p>Укажите координаторов и председателя ГЭК:</p>
                            <label className="me-3 fw-bold label-custom">Координаторы</label>
                            {coordinators.map((coordinator, index) => (
                                <div key={index} className="pt-3 px-3">
                                    <input
                                        type="text" required
                                        style={{minWidth: '15em'}}
                                        className="form-control"
                                        value={coordinator}
                                        onChange={(e) => handleCoordinatorsChange(index, e.target.value)}
                                        placeholder="Иванов Иван Иванович"/>
                                </div>
                            ))}
                            <label className="me-3 fw-bold label-custom mt-3">Председатель</label>
                            <div className="pt-3 px-3">
                                <select
                                    className="form-select mb-3"
                                    value={chairman}
                                    onChange={(e) => setChairman(e.target.value)}>
                                    {meeting.members.map((member, index) => (
                                        <option key={index} value={member.name}>
                                            {member.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </form>

                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-light" data-bs-dismiss="modal">Отмена
                        </button>
                        <button type="button" className="btn btn-primary"
                                onClick={handleDownload}>Скачать
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
