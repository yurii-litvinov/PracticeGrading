import axios from 'axios';
import { useEffect, useState } from 'react';
import {
    approveMeetingAccessRequest,
    getPendingMeetingAccessRequests,
    rejectMeetingAccessRequest,
} from '../services/ApiService';
import {
    PendingMeetingMemberAccess,
} from '../models/MeetingMemberAccess';

interface MeetingAccessRequestsPanelProps {
    meetingId: number;
}

export function MeetingAccessRequestsPanel({
    meetingId,
}: MeetingAccessRequestsPanelProps) {
    const [
        pendingRequests,
        setPendingRequests,
    ] = useState<PendingMeetingMemberAccess[]>([]);

    useEffect(() => {
        let cancelled = false;
        let timeoutId: number | undefined;

        const loadPendingRequests = async () => {
            try {
                const response =
                    await getPendingMeetingAccessRequests(
                        meetingId,
                    );

                if (cancelled) {
                    return;
                }

                setPendingRequests(response.data);
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
                    loadPendingRequests,
                    3000,
                );
            }
        };

        void loadPendingRequests();

        return () => {
            cancelled = true;

            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [meetingId]);

    const handleApprove = async (
        accessId: number,
    ) => {
        try {
            await approveMeetingAccessRequest(
                meetingId,
                accessId,
            );

            setPendingRequests(currentRequests =>
                currentRequests.filter(
                    request => request.id !== accessId,
                ),
            );
        } catch (error) {
            console.error(error);
            alert('Не удалось подтвердить участника');
        }
    };

    const handleReject = async (
        accessId: number,
    ) => {
        try {
            await rejectMeetingAccessRequest(
                meetingId,
                accessId,
            );

            setPendingRequests(currentRequests =>
                currentRequests.filter(
                    request => request.id !== accessId,
                ),
            );
        } catch (error) {
            console.error(error);
            alert('Не удалось отклонить участника');
        }
    };

    if (pendingRequests.length === 0) {
        return null;
    }

    return (
        <div className="card mx-2 mb-4">
            <div className="card-body">
                <h4 className="card-title mb-3">
                    Запросы на участие
                </h4>

                <div className="d-flex flex-column gap-2">
                    {pendingRequests.map(request => (
                        <div
                            key={request.id}
                            className="d-flex justify-content-between align-items-center border rounded p-3"
                        >
                            <div>
                                <div className="fw-bold">
                                    {request.memberName}
                                </div>

                                <div className="text-muted small">
                                    Запрос отправлен:{' '}
                                    {new Date(
                                        request.createdAt,
                                    ).toLocaleString('ru-RU')}
                                </div>
                            </div>

                            <div className="d-flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={() =>
                                        handleApprove(
                                            request.id,
                                        )
                                    }
                                >
                                    Подтвердить
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={() =>
                                        handleReject(
                                            request.id,
                                        )
                                    }
                                >
                                    Отклонить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}