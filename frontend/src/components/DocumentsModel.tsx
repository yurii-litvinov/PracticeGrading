import {useRef, useState, useEffect} from 'react';
import {getDocuments} from '../services/ApiService';

export function DocumentsModel({meeting}) {
    const formRef = useRef();
    const closeButtonRef = useRef();
    const [coordinator, setCoordinator] = useState('');
    const [chairman, setChairman] = useState('');

    useEffect(() => {
        if (meeting.members.length > 0) {
            setChairman(meeting.members[0].name);
        }
    }, [meeting]);

    const handleDownload = async () => {
        console.log(coordinator)
        if (formRef.current && coordinator === '') {
            formRef.current.reportValidity();
            return;
        }

        const response = await getDocuments(meeting.id, coordinator, chairman);
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
                            <p>Укажите координатора и председателя ГЭК:</p>
                            <div className="d-flex align-items-center">
                                <label className="me-3 fw-bold text-end label-custom">Координатор</label>
                                <input
                                    type="text" required
                                    style={{minWidth: '20em'}}
                                    className="form-control w-auto"
                                    value={coordinator}
                                    onChange={(e) => setCoordinator(e.target.value)}
                                    placeholder="Иванов Иван Иванович"/>
                            </div>
                            <div className="d-flex align-items-center">
                                <label className="me-3 fw-bold text-end label-custom mt-2">Председатель</label>
                                <div className="pt-4">
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
