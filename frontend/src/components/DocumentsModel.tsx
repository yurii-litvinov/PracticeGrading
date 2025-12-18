import { useRef, useState, useEffect } from 'react';
import { getDocuments } from '../services/ApiService';
import { Meeting } from '../models/Meeting';
import { Member } from '../models/Member';

interface DocumentsModelProps {
    meeting: Meeting;
}

const COORDINATOR_STORAGE_KEY = 'coordinator_name';

export function DocumentsModel({ meeting }: DocumentsModelProps) {
    const formRef = useRef<HTMLFormElement | null>(null);
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const [coordinator, setCoordinator] = useState('');
    const [secretary, setSecretary] = useState('');
    const [chairman, setChairman] = useState<Member | null>();
    const [chairmanOrder, setOrder] = useState('');

    useEffect(() => {
        const savedCoordinator = localStorage.getItem(COORDINATOR_STORAGE_KEY);

        if (savedCoordinator) {
            setCoordinator(savedCoordinator);
        }

        if (meeting.members.length > 0) {
            setChairman(meeting.members[0]);
        }
    }, [meeting]);

    const handleDownload = async () => {
        if (formRef.current && !formRef.current.checkValidity()) {
            formRef.current.reportValidity();
            return;
        }

        try {
            if (!chairman) {
                alert("Выберите председателя");
                return;
            }

            const response = await getDocuments(meeting.id!, coordinator, chairman.id!, secretary, chairmanOrder);
            const blob = new Blob([response.data]);
            const contentDisposition = response.headers['content-disposition'];
            let filename = "Документы.zip";

            if (contentDisposition) {
                const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
                if (match) {
                    filename = decodeURIComponent(match[1]);
                }
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;

            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            localStorage.setItem(COORDINATOR_STORAGE_KEY, coordinator);
            if (closeButtonRef.current) {
                closeButtonRef.current.click();
            }
        } catch {
            alert('Что-то пошло не так. Пожалуйста, проверьте информацию о заседании, ' +
                'она должна содержать номер комиссии. Например, ГЭК 1234-56.');
        }
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = parseInt(e.target.value);
        const selectedMember = meeting.members.find(m => m.id === selectedId);
        setChairman(selectedMember);
    }

    return (
        <div className="modal fade" id="docsModal" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex={-1}
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
                            <div className="d-flex align-items-center mb-3">
                                <label className="me-3 fw-bold text-end label-custom">Координатор</label>
                                <input
                                    type="text"
                                    required
                                    style={{ minWidth: '20em' }}
                                    className="form-control w-auto"
                                    value={coordinator}
                                    onChange={(e) => setCoordinator(e.target.value)}
                                    placeholder="Иванов Иван Иванович" />
                            </div>
                            <div className="d-flex align-items-center mb-3">
                                <label className="me-3 fw-bold text-end label-custom">Приказ</label>
                                <input
                                    type="text"
                                    required
                                    style={{ minWidth: '20em' }}
                                    className="form-control w-auto"
                                    value={chairmanOrder}
                                    onChange={(e) => setOrder(e.target.value)}
                                    placeholder="DD.MM.YYYY Номер/Версия" />
                            </div>
                            <div className="d-flex align-items-center mb-3">
                                <label className="me-3 fw-bold text-end label-custom">Секретарь</label>
                                <input
                                    type="text"
                                    required
                                    style={{ minWidth: '20em' }}
                                    className="form-control w-auto"
                                    value={secretary}
                                    onChange={(e) => setSecretary(e.target.value)}
                                    placeholder="Иванов Иван Иванович" />
                            </div>
                            <div className="d-flex align-items-center">
                                <label className="me-3 fw-bold text-end label-custom">Председатель</label>
                                <div>
                                    <select
                                        style={{ minWidth: '20em' }}
                                        className="form-select"
                                        value={chairman?.id}
                                        onChange={handleSelectChange}>
                                        {meeting.members.map((member) => (
                                            <option key={member.id} value={member.id}>
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
