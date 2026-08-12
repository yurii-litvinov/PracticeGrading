import { useEffect, useState } from 'react';
import { saveTrustedAccessToken } from
    '../services/TrustedAccessStorage';

type ActivationState =
    'processing' |
    'success' |
    'error';

export function TrustedAccessActivationPage() {
    const [activationToken] = useState(
        () => {
            const searchParameters =
                new URLSearchParams(
                    window.location.search,
                );

            return searchParameters.get('token');
        },
    );

    const [
        activationState,
        setActivationState,
    ] = useState<ActivationState>('processing');

    useEffect(() => {
        if (!activationToken?.trim()) {
            setActivationState('error');
            return;
        }

        saveTrustedAccessToken(
            activationToken,
        );

        const applicationBaseUrl =
            `${window.location.origin}` +
            `${import.meta.env.BASE_URL}`;

        const cleanUrl = new URL(
            'trusted-access',
            applicationBaseUrl,
        );

        window.history.replaceState(
            null,
            document.title,
            cleanUrl,
        );

        setActivationState('success');
    }, [activationToken]);

    return (
        <div className={
            'container min-vh-100 ' +
            'd-flex align-items-center ' +
            'justify-content-center'
        }>
            <div
                className="card shadow-sm"
                style={{ maxWidth: '520px' }}
            >
                <div className="card-body p-4 text-center">
                    {activationState ===
                        'processing' && (
                        <>
                            <div
                                className={
                                    'spinner-border ' +
                                    'text-primary mb-3'
                                }
                                role="status"
                            />

                            <h4>
                                Активация доступа
                            </h4>

                            <p className="text-muted mb-0">
                                Сохранение персонального
                                доступа...
                            </p>
                        </>
                    )}

                    {activationState ===
                        'success' && (
                        <>
                            <div
                                className={
                                    'text-success mb-3'
                                }
                                style={{
                                    fontSize: '48px',
                                }}
                            >
                                <i className={
                                    'bi bi-check-circle'
                                } />
                            </div>

                            <h4>
                                Доступ активирован
                            </h4>

                            <p className="text-muted mb-0">
                                Этот браузер запомнил
                                персональный доступ.
                                Теперь Вы можете открывать
                                общие ссылки на заседания
                                без повторного подтверждения.
                            </p>
                        </>
                    )}

                    {activationState ===
                        'error' && (
                        <>
                            <div
                                className={
                                    'text-danger mb-3'
                                }
                                style={{
                                    fontSize: '48px',
                                }}
                            >
                                <i className={
                                    'bi bi-x-circle'
                                } />
                            </div>

                            <h4>
                                Некорректная ссылка
                            </h4>

                            <p className="text-muted mb-0">
                                В ссылке отсутствует
                                персональный токен.
                                Запросите новую ссылку
                                у администратора.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}