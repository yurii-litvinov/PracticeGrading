import axios from 'axios';
import { useEffect, useState } from 'react';
import {
    getApprovedMeetingAccesses,
    revokeMeetingAccess,
} from '../services/ApiService';
import {
    ApprovedMeetingMemberAccess,
} from '../models/MeetingMemberAccess';

interface ApprovedMeetingAccessesPanelProps {
    meetingId: number;
}

export function ApprovedMeetingAccessesPanel({
    meetingId,
}: ApprovedMeetingAccessesPanelProps) {
    const [
        approvedAccesses,
        setApprovedAccesses,
    ] = useState<ApprovedMeetingMemberAccess[]>([]);

    useEffect(() => {
        let cancelled = false;
        let timeoutId: number | undefined;

        const loadAccesses = async () => {
            try {
                const response =
                    await getApprovedMeetingAccesses(
                        meetingId,
                    );

                if (cancelled) {
                    return;
                }

                setApprovedAccesses(response.data);
            } catch (error) {
                console.error(error);

                if (
                    axios.isAxiosError(error) &&
                    (error.response?.status === 401 ||
                        error.response?.status === 403 ||
                        error.response?.status === 404)
                ) {
                    return;
                }
            }

            if (!cancelled) {
                timeoutId = window.setTimeout(
                    loadAccesses,
                    5000,
                );
            }
        };

        void loadAccesses();

        return () => {
            cancelled = true;

            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [meetingId]);

    const handleRevoke = async (
        access: ApprovedMeetingMemberAccess,
    ) => {
        const confirmed = window.confirm(
            `Отозвать доступ участника «${access.memberName}»?`,
        );

        if (!confirmed) {
            return;
        }

        try {
            await revokeMeetingAccess(
                meetingId,
                access.id,
            );

            setApprovedAccesses(currentAccesses =>
                currentAccesses.filter(
                    currentAccess =>
                        currentAccess.id !== access.id,
                ),
            );
        } catch (error) {
            console.error(error);
            alert('Не удалось отозвать доступ');
        }
    };

    if (approvedAccesses.length === 0) {
        return null;
    }

    return (
        <div className="card mx-2 mb-4">
            <div className="card-body">
                <h4 className="card-title mb-3">
                    Активные доступы участников
                </h4>

                <div className="d-flex flex-column gap-2">
                    {approvedAccesses.map(access => (
                        <div
                            key={access.id}
                            className="d-flex justify-content-between align-items-center border rounded p-3"
                        >
                            <div>
                                <div className="fw-bold">
                                    {access.memberName}
                                </div>

                                <div className="text-muted small">
                                    Подтверждён:{' '}
                                    {access.approvedAt
                                        ? new Date(
                                            access.approvedAt,
                                        ).toLocaleString(
                                            'ru-RU',
                                        )
                                        : '—'}
                                </div>
                            </div>

                            <button
                                type="button"
                                className="btn btn-outline-danger"
                                onClick={() =>
                                    handleRevoke(access)
                                }
                            >
                                Отозвать доступ
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}