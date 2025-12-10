import { useState, useEffect } from 'react';
import { Member } from '../models/Member';
import Button from './Button';

interface MemberModalProps {
    member: Member;
    isOpen: boolean;
    onClose: () => void;
    onSave?: (member: Member) => Promise<void> | void;
    onDelete?: (memberId: number) => Promise<void> | void;
    isLoading?: boolean;
    readOnly?: boolean;
}

export function MemberModal({
    member,
    isOpen,
    onClose,
    onSave,
    onDelete,
    isLoading = false,
    readOnly = false
}: MemberModalProps) {
    const [formData, setFormData] = useState<Member>(member);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        setFormData(member);
        setErrors({});
    }, [member]);

    if (!isOpen) return null;

    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    };

    const getAvatarColor = (id: number): string => {
        const colors = ['#0d6efd', '#198754', '#dc3545', '#6f42c1', '#fd7e14'];
        return colors[id % colors.length];
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Имя обязательно';
        }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Некорректный email';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm() || !onSave) return;
        await onSave(formData);
    };

    const handleDelete = async () => {
        if (!onDelete || !member.id) return;

        if (window.confirm(`Вы уверены, что хотите удалить ${member.name || 'этого пользователя'}?`)) {
            await onDelete(member.id);
        }
    };

    const handleChange = (field: keyof Member, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const isEditMode = !!member.id;
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(member);
    const canSave = onSave && !isLoading && formData.name.trim() && (!isEditMode || hasChanges);

    return (
        <>
            <div
                className="modal-backdrop show"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 1040
                }}
                onClick={onClose}
            />

            <div
                className="modal show d-block"
                tabIndex={-1}
                style={{ zIndex: 1050 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div className="d-flex align-items-center">
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        fontSize: '18px',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        backgroundColor: readOnly ? '#6c757d' : (isEditMode ? getAvatarColor(member.id!) : '#198754')
                                    }}
                                >
                                    {getInitials(formData.name || 'Н')}
                                </div>
                                <div>
                                    <h5 className="modal-title mb-0">
                                        {readOnly ? (
                                            member.name || 'Просмотр'
                                        ) : isEditMode ? (
                                            `Редактирование: ${member.name}`
                                        ) : (
                                            'Добавление нового члена комиссии'
                                        )}
                                    </h5>
                                    {isEditMode && <small className="text-muted">ID: {member.id}</small>}
                                    {readOnly && <small className="text-muted">Режим просмотра</small>}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={onClose}
                                aria-label="Close"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">
                                    Имя {!readOnly && <span className="text-danger">*</span>}
                                </label>
                                {readOnly ? (
                                    <div className="form-control-plaintext border-bottom pb-2">
                                        {formData.name || 'Не указано'}
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        placeholder="Введите ФИО"
                                        disabled={isLoading}
                                    />
                                )}
                                {!readOnly && errors.name && (
                                    <div className="invalid-feedback">{errors.name}</div>
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                {readOnly ? (
                                    <div className="form-control-plaintext border-bottom pb-2">
                                        {formData.email || 'Не указан'}
                                    </div>
                                ) : (
                                    <input
                                        type="email"
                                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                        value={formData.email || ''}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        placeholder="example@domain.com"
                                        disabled={isLoading}
                                    />
                                )}
                                {!readOnly && errors.email && (
                                    <div className="invalid-feedback">{errors.email}</div>
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Телефон</label>
                                {readOnly ? (
                                    <div className="form-control-plaintext border-bottom pb-2">
                                        {formData.phone || 'Не указан'}
                                    </div>
                                ) : (
                                    <input
                                        type="tel"
                                        className="form-control"
                                        value={formData.phone || ''}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        placeholder="+7 (XXX) XXX-XX-XX"
                                        disabled={isLoading}
                                    />
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Информация (Русский)</label>
                                {readOnly ? (
                                    <div className="form-control-plaintext border rounded p-2 bg-light min-h-100">
                                        {formData.informationRu || 'Не указана'}
                                    </div>
                                ) : (
                                    <textarea
                                        className="form-control"
                                        value={formData.informationRu || ''}
                                        onChange={(e) => handleChange('informationRu', e.target.value)}
                                        placeholder="Дополнительная информация на русском"
                                        rows={3}
                                        disabled={isLoading}
                                    />
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Информация (Английский)</label>
                                {readOnly ? (
                                    <div className="form-control-plaintext border rounded p-2 bg-light min-h-100">
                                        {formData.informationEn || 'Не указана'}
                                    </div>
                                ) : (
                                    <textarea
                                        className="form-control"
                                        value={formData.informationEn || ''}
                                        onChange={(e) => handleChange('informationEn', e.target.value)}
                                        placeholder="Additional information in English"
                                        rows={3}
                                        disabled={isLoading}
                                    />
                                )}
                            </div>
                        </div>

                        {(!readOnly || onDelete) && (
                            <div className="modal-footer">
                                <div className="d-flex justify-content-between w-100">
                                    <div>
                                        {!readOnly && isEditMode && onDelete && (
                                            <Button
                                                variant="danger"
                                                outline
                                                onClick={handleDelete}
                                                disabled={isLoading}
                                            >
                                                Удалить
                                            </Button>
                                        )}
                                    </div>

                                    <div className="d-flex gap-2">
                                        {!readOnly ? (
                                            <>
                                                <Button
                                                    variant="secondary"
                                                    onClick={onClose}
                                                    disabled={isLoading}
                                                >
                                                    Отмена
                                                </Button>

                                                {onSave && (
                                                    <Button
                                                        variant="primary"
                                                        onClick={handleSubmit}
                                                        disabled={!canSave}
                                                    >
                                                        {isLoading ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                                Сохранение...
                                                            </>
                                                        ) : isEditMode ? (
                                                            'Сохранить'
                                                        ) : (
                                                            'Добавить'
                                                        )}
                                                    </Button>
                                                )}
                                            </>
                                        ) : (
                                            <Button
                                                variant="secondary"
                                                onClick={onClose}
                                            >
                                                Закрыть
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        .min-h-100 {
          min-height: 100px;
        }
      `}</style>
        </>
    );
}