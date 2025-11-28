import { Member } from '../models/Member'
import Button from './Button'
import { useState, useEffect } from 'react';

export enum MemberFormMode {
    ADD = 'add',
    EDIT = 'edit',
    VIEW = 'view'
}

interface MemberFormProps {
    member?: Member | null;
    mode: MemberFormMode;
    searchName?: string;
    onCancel?: () => void;
    onSave?: (memberData: Member) => void;
}

export default function MemberForm({
    member,
    mode = MemberFormMode.VIEW,
    searchName,
    onCancel,
    onSave
}: MemberFormProps) {
    const [formData, setFormData] = useState<Partial<Member>>({
        name: '',
        email: '',
        phone: '',
        informationEn: '',
        informationRu: '',
    });

    useEffect(() => {
        switch (mode) {
            case MemberFormMode.ADD:
                setFormData({ name: searchName })
                break;
            case MemberFormMode.EDIT:
                if (!member) {
                    alert("Не выбран пользователь.");
                }
                else {
                    setFormData(member);
                }
        }
    }, [mode])

    useEffect(() => {
        if (mode === MemberFormMode.VIEW) {
            if (!member) {
                setFormData({});
                return;
            }
            setFormData(member);
        }
    }, [member])

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (mode === MemberFormMode.VIEW) return;

        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (event: React.FormEvent) => {
        const cleanMemberData = {
            ...formData,
            name: formData.name?.trim() || '',
            email: formData.email?.trim() || '',
            phone: formData.phone?.trim() || '',
            informationRu: formData.informationRu?.trim() || '',
            informationEn: formData.informationEn?.trim() || '',
        };
        event.preventDefault();
        if (mode === MemberFormMode.VIEW) return;
        onSave?.(cleanMemberData);
    };

    const handleFormCancel = () => {
        setFormData(member ? member : {})
        onCancel?.();
    }

    return (
        <>
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">
                        {mode === MemberFormMode.EDIT ? 'Редактирование члена' : (mode === MemberFormMode.ADD ? 'Добавление нового члена' : 'Просмотр члена')}
                    </h5>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Фамилия, имя, отчество</label>
                            <input
                                type="text"
                                className="form-control"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                disabled={mode === MemberFormMode.VIEW}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-control"
                                name="email"
                                value={formData.email || ''}
                                onChange={handleChange}
                                disabled={mode === MemberFormMode.VIEW}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Телефон</label>
                            <input
                                type="phone"
                                className="form-control"
                                name="phone"
                                value={formData.phone || ''}
                                onChange={handleChange}
                                disabled={mode === MemberFormMode.VIEW}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Информация на русском</label>
                            <textarea
                                className="form-control"
                                name="informationRu"
                                value={formData.informationRu || ''}
                                onChange={handleChange}
                                disabled={mode === MemberFormMode.VIEW}
                                rows={4}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Информация на английском</label>
                            <textarea
                                className="form-control"
                                name="informationEn"
                                value={formData.informationEn || ''}
                                onChange={handleChange}
                                disabled={mode === MemberFormMode.VIEW}
                                rows={4}
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        {mode != MemberFormMode.VIEW && (
                            <div className="d-flex gap-2">
                                <Button type="submit" variant="primary">
                                    {member ? 'Сохранить' : 'Добавить'}
                                </Button>
                                <Button type="button" variant="secondary" onClick={handleFormCancel}>
                                    Отмена
                                </Button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </>
    )
}