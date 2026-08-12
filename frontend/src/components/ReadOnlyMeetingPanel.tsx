import axios from 'axios';
import { useEffect, useState } from 'react';
import { Meeting } from '../models/Meeting';
import { getReadOnlyMeeting } from '../services/ApiService';
import { formatDate } from '../pages/MeetingsPage';

interface ReadOnlyMeetingPanelProps {
    meetingId: number;
    accessToken: string;
}

export function ReadOnlyMeetingPanel({
    meetingId,
    accessToken,
}: ReadOnlyMeetingPanelProps) {
    const [meeting, setMeeting] =
        useState<Meeting | null>(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [errorMessage, setErrorMessage] =
        useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadMeeting = async () => {
            try {
                setIsLoading(true);

                const response =
                    await getReadOnlyMeeting(
                        meetingId,
                        accessToken,
                    );

                if (cancelled) {
                    return;
                }

                setMeeting(response.data);
                setErrorMessage(null);
            } catch (error) {
                console.error(error);

                if (cancelled) {
                    return;
                }

                if (
                    axios.isAxiosError(error) &&
                    (error.response?.status === 401 ||
                        error.response?.status === 403)
                ) {
                    setErrorMessage(
                        'Доступ к просмотру отсутствует.',
                    );
                } else {
                    setErrorMessage(
                        'Не удалось загрузить заседание.',
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        void loadMeeting();

        return () => {
            cancelled = true;
        };
    }, [accessToken, meetingId]);

    if (isLoading) {
        return (
            <div className="text-center py-4">
                Загрузка заседания...
            </div>
        );
    }

    if (errorMessage) {
        return (
            <div className="alert alert-warning">
                {errorMessage}
            </div>
        );
    }

    if (!meeting) {
        return null;
    }

    return (
        <div className="card">
            <div className="card-body">
                <h4 className="card-title mb-4">
                    Просмотр заседания
                </h4>

                <dl className="row">
                    <dt className="col-sm-3">
                        Дата и время
                    </dt>
                    <dd className="col-sm-9">
                        {formatDate(meeting.dateAndTime)}
                    </dd>

                    <dt className="col-sm-3">
                        Аудитория
                    </dt>
                    <dd className="col-sm-9">
                        {meeting.auditorium || '—'}
                    </dd>

                    <dt className="col-sm-3">
                        Информация
                    </dt>
                    <dd className="col-sm-9">
                        {meeting.info || '—'}
                    </dd>

                    {meeting.callLink && (
                        <>
                            <dt className="col-sm-3">
                                Ссылка на созвон
                            </dt>
                            <dd className="col-sm-9">
                                <a
                                    href={meeting.callLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {meeting.callLink}
                                </a>
                            </dd>
                        </>
                    )}

                    {meeting.materialsLink && (
                        <>
                            <dt className="col-sm-3">
                                Материалы
                            </dt>
                            <dd className="col-sm-9">
                                <a
                                    href={meeting.materialsLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {meeting.materialsLink}
                                </a>
                            </dd>
                        </>
                    )}
                </dl>

                <h5 className="mt-4">
                    Работы студентов
                </h5>

                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>ФИО</th>
                                <th>Тема</th>
                                <th>Научный руководитель</th>
                                <th>Итоговая оценка</th>
                            </tr>
                        </thead>

                        <tbody>
                            {meeting.studentWorks.map(work => (
                                <tr key={work.id}>
                                    <td>
                                        {work.studentName}
                                    </td>
                                    <td>
                                        {work.theme || '—'}
                                    </td>
                                    <td>
                                        {work.supervisor || '—'}
                                    </td>
                                    <td>
                                        {work.finalMark || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}