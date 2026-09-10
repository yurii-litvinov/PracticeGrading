import { useEffect, useState } from 'react';
import { Member } from '../models/Member';
import { TrustedMemberAccessStatus } from
    '../models/TrustedMemberAccessStatus';
import {
    getTrustedMemberAccessStatus,
    issueTrustedMemberAccess,
    revokeTrustedMemberAccess,
} from '../services/ApiService';
import Button from './Button';

interface MemberModalProps {
    member: Member;
    isOpen: boolean;
    onClose: () => void;
    onSave?: (member: Member) => Promise<void> | void;
    onDelete?: (memberId: number) => Promise<void> | void;
    onTrustedAccessChanged?: () => void;
    isLoading?: boolean;
    readOnly?: boolean;
}

export function MemberModal({
    member,
    isOpen,
    onClose,
    onSave,
    onDelete,
    onTrustedAccessChanged,
    isLoading = false,
    readOnly = false,
}: MemberModalProps) {
    const [formData, setFormData] =
        useState<Member>(member);

    const [errors, setErrors] =
        useState<{ [key: string]: string }>({});

    const [
        trustedAccessStatus,
        setTrustedAccessStatus,
    ] = useState<TrustedMemberAccessStatus | null>(null);

    const [
        isTrustedAccessLoading,
        setIsTrustedAccessLoading,
    ] = useState(false);

    const [
        isTrustedAccessUpdating,
        setIsTrustedAccessUpdating,
    ] = useState(false);

    const [
        trustedAccessError,
        setTrustedAccessError,
    ] = useState<string | null>(null);

    const [
        issuedTrustedAccessLink,
        setIssuedTrustedAccessLink,
    ] = useState<string | null>(null);

    const [
        isTrustedAccessLinkCopied,
        setIsTrustedAccessLinkCopied,
    ] = useState(false);

    useEffect(() => {
        setFormData(member);
        setErrors({});
    }, [member]);

    useEffect(() => {
        const memberId = member.id;

        setIssuedTrustedAccessLink(null);
        setIsTrustedAccessLinkCopied(false);

        if (!isOpen || !memberId || readOnly) {
            setTrustedAccessStatus(null);
            setTrustedAccessError(null);
            setIsTrustedAccessLoading(false);
            return;
        }

        let cancelled = false;

        const loadTrustedAccessStatus = async () => {
            setIsTrustedAccessLoading(true);
            setTrustedAccessStatus(null);
            setTrustedAccessError(null);

            try {
                const response =
                    await getTrustedMemberAccessStatus(
                        memberId,
                    );

                if (!cancelled) {
                    setTrustedAccessStatus(
                        response.data,
                    );
                }
            } catch {
                if (!cancelled) {
                    setTrustedAccessError(
                        'Не удалось загрузить состояние доверенного доступа',
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsTrustedAccessLoading(false);
                }
            }
        };

        void loadTrustedAccessStatus();

        return () => {
            cancelled = true;
        };
    }, [isOpen, member.id, readOnly]);

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
        const colors = [
            '#0d6efd',
            '#198754',
            '#dc3545',
            '#6f42c1',
            '#fd7e14',
        ];

        return colors[id % colors.length];
    };

    const validateForm = (): boolean => {
        const newErrors: {
            [key: string]: string;
        } = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Имя обязательно';
        }

        if (
            formData.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                formData.email,
            )
        ) {
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

        const confirmed = window.confirm(
            `Вы уверены, что хотите удалить ${
                member.name || 'этого пользователя'
            }?`,
        );

        if (confirmed) {
            await onDelete(member.id);
        }
    };

    const handleChange = (
        field: keyof Member,
        value: string,
    ) => {
        setFormData(previousFormData => ({
            ...previousFormData,
            [field]: value,
        }));

        if (errors[field]) {
            setErrors(previousErrors => ({
                ...previousErrors,
                [field]: '',
            }));
        }
    };

    const createTrustedAccessLink = (
        token: string,
    ): string => {
        const applicationBaseUrl =
            `${window.location.origin}` +
            `${import.meta.env.BASE_URL}`;

        const activationUrl = new URL(
            'trusted-access',
            applicationBaseUrl,
        );

        activationUrl.hash =
            new URLSearchParams({
                token,
            }).toString();

        return activationUrl.toString();
    };

    const handleIssueTrustedAccess = async () => {
        if (!member.id) return;

        if (
            trustedAccessStatus?.isActive &&
            !window.confirm(
                'Старая персональная ссылка перестанет работать. Продолжить?',
            )
        ) {
            return;
        }

        setIsTrustedAccessUpdating(true);
        setTrustedAccessError(null);
        setIsTrustedAccessLinkCopied(false);

        try {
            const response =
                await issueTrustedMemberAccess(
                    member.id,
                );

            const link = createTrustedAccessLink(
                response.data.token,
            );

            setIssuedTrustedAccessLink(link);

            setTrustedAccessStatus({
                isIssued: true,
                isActive: true,
                createdAt:
                    new Date().toISOString(),
                revokedAt: null,
            });

            onTrustedAccessChanged?.();
        } catch {
            setTrustedAccessError(
                'Не удалось выдать доверенный доступ',
            );
        } finally {
            setIsTrustedAccessUpdating(false);
        }
    };

    const handleRevokeTrustedAccess = async () => {
        if (!member.id) return;

        const confirmed = window.confirm(
            'Отозвать доверенный доступ этого участника?',
        );

        if (!confirmed) return;

        setIsTrustedAccessUpdating(true);
        setTrustedAccessError(null);

        try {
            await revokeTrustedMemberAccess(
                member.id,
            );

            setIssuedTrustedAccessLink(null);
            setIsTrustedAccessLinkCopied(false);

            setTrustedAccessStatus(
                previousStatus => ({
                    isIssued: true,
                    isActive: false,
                    createdAt:
                        previousStatus?.createdAt ??
                        null,
                    revokedAt:
                        new Date().toISOString(),
                }),
            );
            onTrustedAccessChanged?.();
        } catch {
            setTrustedAccessError(
                'Не удалось отозвать доверенный доступ',
            );
        } finally {
            setIsTrustedAccessUpdating(false);
        }
    };

    const handleCopyTrustedAccessLink =
        async () => {
            if (!issuedTrustedAccessLink) return;

            try {
                await navigator.clipboard.writeText(
                    issuedTrustedAccessLink,
                );

                setIsTrustedAccessLinkCopied(true);
            } catch {
                setTrustedAccessError(
                    'Не удалось скопировать ссылку автоматически',
                );
            }
        };

    const isEditMode = !!member.id;

    const hasChanges =
        JSON.stringify(formData) !==
        JSON.stringify(member);

    const canSave =
        onSave &&
        !isLoading &&
        formData.name.trim() &&
        (!isEditMode || hasChanges);

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
                    backgroundColor:
                        'rgba(0,0,0,0.5)',
                    zIndex: 1040,
                }}
                onClick={onClose}
            />

            <div
                className="modal show d-block"
                tabIndex={-1}
                style={{ zIndex: 1050 }}
                onClick={event =>
                    event.stopPropagation()
                }
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div className="d-flex align-items-center">
                                <div
                                    className={
                                        'rounded-circle ' +
                                        'd-flex ' +
                                        'align-items-center ' +
                                        'justify-content-center ' +
                                        'me-3'
                                    }
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        fontSize: '18px',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        backgroundColor:
                                            readOnly
                                                ? '#6c757d'
                                                : isEditMode
                                                    ? getAvatarColor(
                                                        member.id!,
                                                    )
                                                    : '#198754',
                                    }}
                                >
                                    {getInitials(
                                        formData.name ||
                                        'Н',
                                    )}
                                </div>

                                <div>
                                    <h5 className="modal-title mb-0">
                                        {readOnly
                                            ? member.name ||
                                              'Просмотр'
                                            : isEditMode
                                                ? `Редактирование: ${member.name}`
                                                : 'Добавление нового члена комиссии'}
                                    </h5>

                                    {isEditMode && (
                                        <small className="text-muted">
                                            ID: {member.id}
                                        </small>
                                    )}

                                    {readOnly && (
                                        <small className="text-muted">
                                            Режим просмотра
                                        </small>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                className="btn-close"
                                onClick={onClose}
                                aria-label="Close"
                                disabled={
                                    isLoading ||
                                    isTrustedAccessUpdating
                                }
                            />
                        </div>

                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">
                                    Имя{' '}
                                    {!readOnly && (
                                        <span className="text-danger">
                                            *
                                        </span>
                                    )}
                                </label>

                                {readOnly ? (
                                    <div className="form-control-plaintext border-bottom pb-2">
                                        {formData.name ||
                                            'Не указано'}
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        name="name"
                                        className={
                                            `form-control ${
                                                errors.name
                                                    ? 'is-invalid'
                                                    : ''
                                            }`
                                        }
                                        value={
                                            formData.name
                                        }
                                        onChange={event =>
                                            handleChange(
                                                'name',
                                                event.target
                                                    .value,
                                            )
                                        }
                                        placeholder="Введите ФИО"
                                        disabled={
                                            isLoading
                                        }
                                    />
                                )}

                                {!readOnly &&
                                    errors.name && (
                                        <div className="invalid-feedback">
                                            {errors.name}
                                        </div>
                                    )}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">
                                    Email
                                </label>

                                {readOnly ? (
                                    <div className="form-control-plaintext border-bottom pb-2">
                                        {formData.email ||
                                            'Не указан'}
                                    </div>
                                ) : (
                                    <input
                                        type="email"
                                        name="email"
                                        className={
                                            `form-control ${
                                                errors.email
                                                    ? 'is-invalid'
                                                    : ''
                                            }`
                                        }
                                        value={
                                            formData.email ||
                                            ''
                                        }
                                        onChange={event =>
                                            handleChange(
                                                'email',
                                                event.target
                                                    .value,
                                            )
                                        }
                                        placeholder="example@domain.com"
                                        disabled={
                                            isLoading
                                        }
                                    />
                                )}

                                {!readOnly &&
                                    errors.email && (
                                        <div className="invalid-feedback">
                                            {errors.email}
                                        </div>
                                    )}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">
                                    Телефон
                                </label>

                                {readOnly ? (
                                    <div className="form-control-plaintext border-bottom pb-2">
                                        {formData.phone ||
                                            'Не указан'}
                                    </div>
                                ) : (
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="form-control"
                                        value={
                                            formData.phone ||
                                            ''
                                        }
                                        onChange={event =>
                                            handleChange(
                                                'phone',
                                                event.target
                                                    .value,
                                            )
                                        }
                                        placeholder="+7 (XXX) XXX-XX-XX"
                                        disabled={
                                            isLoading
                                        }
                                    />
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">
                                    Информация (Русский)
                                </label>

                                {readOnly ? (
                                    <div className="form-control-plaintext border rounded p-2 bg-light min-h-100">
                                        {formData
                                            .informationRu ||
                                            'Не указана'}
                                    </div>
                                ) : (
                                    <textarea
                                        name="information-ru"
                                        className="form-control"
                                        value={
                                            formData
                                                .informationRu ||
                                            ''
                                        }
                                        onChange={event =>
                                            handleChange(
                                                'informationRu',
                                                event.target
                                                    .value,
                                            )
                                        }
                                        placeholder="Дополнительная информация на русском"
                                        rows={3}
                                        disabled={
                                            isLoading
                                        }
                                    />
                                )}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">
                                    Информация (Английский)
                                </label>

                                {readOnly ? (
                                    <div className="form-control-plaintext border rounded p-2 bg-light min-h-100">
                                        {formData
                                            .informationEn ||
                                            'Не указана'}
                                    </div>
                                ) : (
                                    <textarea
                                        name="information-en"
                                        className="form-control"
                                        value={
                                            formData
                                                .informationEn ||
                                            ''
                                        }
                                        onChange={event =>
                                            handleChange(
                                                'informationEn',
                                                event.target
                                                    .value,
                                            )
                                        }
                                        placeholder="Additional information in English"
                                        rows={3}
                                        disabled={
                                            isLoading
                                        }
                                    />
                                )}
                            </div>

                            {isEditMode &&
                                !readOnly && (
                                    <div className="border-top pt-3 mt-4">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <h6 className="mb-0">
                                                Доверенный
                                                доступ
                                            </h6>

                                            {!isTrustedAccessLoading &&
                                                trustedAccessStatus && (
                                                    <span
                                                        className={
                                                            trustedAccessStatus
                                                                .isActive
                                                                ? 'badge bg-success'
                                                                : 'badge bg-secondary'
                                                        }
                                                    >
                                                        {trustedAccessStatus
                                                            .isActive
                                                            ? 'Активен'
                                                            : trustedAccessStatus
                                                                  .isIssued
                                                                ? 'Отозван'
                                                                : 'Не выдавался'}
                                                    </span>
                                                )}
                                        </div>

                                        {isTrustedAccessLoading && (
                                            <div className="text-muted mt-2">
                                                Загрузка
                                                состояния...
                                            </div>
                                        )}

                                        {trustedAccessError && (
                                            <div className="alert alert-danger mt-3 mb-0">
                                                {
                                                    trustedAccessError
                                                }
                                            </div>
                                        )}

                                        {!isTrustedAccessLoading &&
                                            !trustedAccessError &&
                                            trustedAccessStatus && (
                                                <p className="text-muted small mt-2 mb-0">
                                                    {trustedAccessStatus
                                                        .isActive
                                                        ? 'Участник может входить на заседания по персональной ссылке.'
                                                        : trustedAccessStatus
                                                              .isIssued
                                                            ? 'Доступ был отозван. Старый токен больше не действует.'
                                                            : 'Персональная ссылка ещё не создавалась.'}
                                                </p>
                                            )}

                                        {!isTrustedAccessLoading &&
                                            trustedAccessStatus && (
                                                <div className="d-flex gap-2 mt-3">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={
                                                            handleIssueTrustedAccess
                                                        }
                                                        disabled={
                                                            isTrustedAccessUpdating
                                                        }
                                                    >
                                                        {isTrustedAccessUpdating
                                                            ? 'Выполнение...'
                                                            : trustedAccessStatus
                                                                  .isActive
                                                                ? 'Перевыпустить ссылку'
                                                                : 'Выдать ссылку'}
                                                    </Button>

                                                    {trustedAccessStatus
                                                        .isActive && (
                                                        <Button
                                                            variant="danger"
                                                            outline
                                                            size="sm"
                                                            onClick={
                                                                handleRevokeTrustedAccess
                                                            }
                                                            disabled={
                                                                isTrustedAccessUpdating
                                                            }
                                                        >
                                                            Отозвать
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                        {issuedTrustedAccessLink && (
                                            <div className="alert alert-warning mt-3 mb-0">
                                                <div className="small fw-semibold mb-2">
                                                    Персональная
                                                    ссылка
                                                </div>

                                                <div className="input-group input-group-sm">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={
                                                            issuedTrustedAccessLink
                                                        }
                                                        readOnly
                                                        onFocus={event =>
                                                            event.currentTarget.select()
                                                        }
                                                    />

                                                    <Button
                                                        variant={
                                                            isTrustedAccessLinkCopied
                                                                ? 'success'
                                                                : 'secondary'
                                                        }
                                                        size="sm"
                                                        onClick={
                                                            handleCopyTrustedAccessLink
                                                        }
                                                    >
                                                        {isTrustedAccessLinkCopied
                                                            ? 'Скопировано'
                                                            : 'Копировать'}
                                                    </Button>
                                                </div>

                                                <div className="small mt-2">
                                                    Ссылка
                                                    содержит
                                                    секрет и
                                                    показывается
                                                    только после
                                                    выдачи.
                                                    Передайте её
                                                    непосредственно
                                                    выбранному
                                                    члену
                                                    комиссии.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>

                        {(!readOnly || onDelete) && (
                            <div className="modal-footer">
                                <div className="d-flex justify-content-between w-100">
                                    <div>
                                        {!readOnly &&
                                            isEditMode &&
                                            onDelete && (
                                                <Button
                                                    id="delete-member-button"
                                                    variant="danger"
                                                    outline
                                                    onClick={
                                                        handleDelete
                                                    }
                                                    disabled={
                                                        isLoading ||
                                                        isTrustedAccessUpdating
                                                    }
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
                                                    onClick={
                                                        onClose
                                                    }
                                                    disabled={
                                                        isLoading ||
                                                        isTrustedAccessUpdating
                                                    }
                                                >
                                                    Отмена
                                                </Button>

                                                {onSave && (
                                                    <Button
                                                        id="form-submit-button"
                                                        variant="primary"
                                                        onClick={
                                                            handleSubmit
                                                        }
                                                        disabled={
                                                            !canSave ||
                                                            isTrustedAccessUpdating
                                                        }
                                                    >
                                                        {isLoading ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-2" />
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
                                                onClick={
                                                    onClose
                                                }
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