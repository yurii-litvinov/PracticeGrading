import axios from "axios";
import { FormEvent, useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    createMeetingAccessRequest,
    getMeetingAccessStatus,
    getMembers,
    loginApprovedMeetingMember,
    setAuthHeader,
    loginTrustedMember,
} from "../services/ApiService";
import {
    getMeetingAccessToken,
    removeMeetingAccessToken,
    saveMeetingAccessToken,
} from "../services/MeetingAccessStorage";
import { MeetingMemberAccessStatus } from "../models/MeetingMemberAccess";
import { Member } from "../models/Member";
import {
    ReadOnlyMeetingPanel,
} from '../components/ReadOnlyMeetingPanel';
import {
    getTrustedAccessToken,
    removeTrustedAccessToken,
} from '../services/TrustedAccessStorage';

export function MemberLoginPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const meetingId = Number(id);

    const [members, setMembers] = useState<Member[]>([]);

    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    const [customName, setCustomName] = useState("");

    const [accessToken, setAccessToken] = useState<string | null>(null);

    const [accessStatus, setAccessStatus] =
        useState<MeetingMemberAccessStatus | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [
        isTrustedLoginChecked,
        setIsTrustedLoginChecked,
    ] = useState(false);

    const trustedLoginRequestRef = useRef<{
        meetingId: number;
        token: string;
        request: ReturnType<typeof loginTrustedMember>;
    } | null>(null);

    useEffect(() => {
        if (!id || Number.isNaN(meetingId)) {
            return;
        }

        let cancelled = false;

        const loadMembers = async () => {
            try {
                const response = await getMembers(meetingId);

                if (cancelled) {
                    return;
                }

                setMembers(response.data);

                if (response.data.length > 0) {
                    setSelectedMember(response.data[0]);
                }
            } catch (error) {
                console.error(error);

                if (!cancelled) {
                    setErrorMessage("Не удалось загрузить список участников");
                }
            }
        };

        void loadMembers();

        return () => {
            cancelled = true;
        };
    }, [id, meetingId]);

    useEffect(() => {
        if (!isTrustedLoginChecked || !id || Number.isNaN(meetingId)) {
            return;
        }

        setAccessToken(getMeetingAccessToken(meetingId));
    }, [id,isTrustedLoginChecked, meetingId]);

    useEffect(() => {
        if (!id || Number.isNaN(meetingId)) {
            setIsTrustedLoginChecked(true);
            return;
        }

        const trustedAccessToken =
            getTrustedAccessToken();

        if (!trustedAccessToken) {
            setIsTrustedLoginChecked(true);
            return;
        }

        const existingRequest =
            trustedLoginRequestRef.current;

        const trustedLoginRequest =
            existingRequest?.meetingId === meetingId &&
            existingRequest.token === trustedAccessToken
                ? existingRequest.request
                : loginTrustedMember(
                    meetingId,
                    trustedAccessToken,
                );

        trustedLoginRequestRef.current = {
            meetingId,
            token: trustedAccessToken,
            request: trustedLoginRequest,
        };

        let cancelled = false;

        const tryTrustedLogin = async () => {
            try {
                const response =
                    await trustedLoginRequest;

                if (cancelled) {
                    return;
                }

                const jwt = response.data.token;

                sessionStorage.setItem(
                    'token',
                    jwt,
                );

                setAuthHeader(jwt);

                navigate(
                    `/meetings/${meetingId}/member`,
                    { replace: true },
                );
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
                    removeTrustedAccessToken();
                } else {
                    setErrorMessage(
                        'Не удалось проверить доверенный доступ.',
                    );
                }

                setIsTrustedLoginChecked(true);
            }
        };

        void tryTrustedLogin();

        return () => {
            cancelled = true;
        };
    }, [id, meetingId, navigate]);

    useEffect(() => {
        if (!id || Number.isNaN(meetingId) || !accessToken) {
            return;
        }

        let cancelled = false;
        let timeoutId: number | undefined;

        const checkStatus = async () => {
            try {
                const statusResponse = await getMeetingAccessStatus(
                    meetingId,
                    accessToken,
                );

                if (cancelled) {
                    return;
                }

                const status = statusResponse.data.status;

                setAccessStatus(status);
                setErrorMessage(null);

                if (status === MeetingMemberAccessStatus.Approved) {
                    const loginResponse = await loginApprovedMeetingMember(
                        meetingId,
                        accessToken,
                    );

                    if (cancelled) {
                        return;
                    }

                    const jwt = loginResponse.data.token;

                    sessionStorage.setItem("token", jwt);

                    setAuthHeader(jwt);

                    navigate(`/meetings/${meetingId}/member`, {
                        replace: true,
                    });

                    return;
                }

                if (
                    status === MeetingMemberAccessStatus.Rejected ||
                    status === MeetingMemberAccessStatus.Revoked
                ) {
                    removeMeetingAccessToken(meetingId);
                    setAccessToken(null);
                    return;
                }
            } catch (error) {
                console.error(error);

                if (
                    axios.isAxiosError(error) &&
                    (error.response?.status === 401 ||
                        error.response?.status === 403 ||
                        error.response?.status === 404)
                ) {
                    removeMeetingAccessToken(meetingId);
                    setAccessToken(null);
                    setAccessStatus(null);
                    return;
                }

                if (!cancelled) {
                    setErrorMessage(
                        "Не удалось проверить статус заявки. Повторяем попытку.",
                    );
                }
            }

            if (!cancelled) {
                timeoutId = window.setTimeout(checkStatus, 3000);
            }
        };

        void checkStatus();

        return () => {
            cancelled = true;

            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [accessToken, id, meetingId, navigate]);

    const handleLogin = async (event: FormEvent) => {
        event.preventDefault();

        const trimmedName = customName.trim();

        if (!selectedMember && !trimmedName) {
            setErrorMessage("Выберите себя из списка или введите ФИО");
            return;
        }

        const request = selectedMember
            ? {
                  memberId: selectedMember.id,
              }
            : {
                  memberId: 0,
                  userName: trimmedName,
              };

        try {
            setIsSubmitting(true);
            setErrorMessage(null);

            const response = await createMeetingAccessRequest(
                meetingId,
                request,
            );

            const token = response.data.token;

            saveMeetingAccessToken(meetingId, token);

            setAccessToken(token);
            setAccessStatus(MeetingMemberAccessStatus.Pending);
        } catch (error) {
            console.error(error);

            setErrorMessage("Не удалось отправить запрос на участие");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectChange = (
        event: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        const selectedId = Number(event.target.value);

        if (selectedId === 0) {
            setSelectedMember(null);
            return;
        }

        const member =
            members.find((currentMember) => currentMember.id === selectedId) ??
            null;

        setSelectedMember(member);
        setCustomName("");
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCustomName(event.target.value);
        setSelectedMember(null);
    };

    if (!isTrustedLoginChecked) {
    return (
        <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: '100vh' }}
        >
            <div className="text-center">
                Проверка доверенного доступа...
            </div>
        </div>
    );
}

    if (
        accessStatus === MeetingMemberAccessStatus.Pending) {
    return (
        <div
            className="container py-4"
            data-testid="member-access-pending">
            <div className="alert alert-info text-center">
                <h4>Запрос отправлен</h4>

                <p className="mb-1">
                    Ожидается подтверждение администратором
                    или членом комиссии.
                </p>

                <p className="small mb-0">
                    Статус проверяется автоматически.
                </p>
            </div>

            {errorMessage && (
                <div className="alert alert-warning">
                    {errorMessage}
                </div>
            )}

            {accessToken && (
                <ReadOnlyMeetingPanel
                    meetingId={meetingId}
                    accessToken={accessToken}
                />
            )}
        </div>
    );
}

    return (
        <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "100vh" }}
        >
            <div className="card">
                <div className="card-body">
                    <h4 className="card-title text-center mb-4">Вход</h4>

                    {accessStatus === MeetingMemberAccessStatus.Rejected && (
                        <div className="alert alert-danger">
                            Запрос на участие отклонён. Можно отправить новый
                            запрос.
                        </div>
                    )}

                    {accessStatus === MeetingMemberAccessStatus.Revoked && (
                        <div className="alert alert-warning">
                            Доступ к заседанию отозван.
                        </div>
                    )}

                    {errorMessage && (
                        <div className="alert alert-danger">{errorMessage}</div>
                    )}

                    <form onSubmit={handleLogin}>
                        <h6 className="mb-3">Выберите себя из списка</h6>

                        <select
                            className="form-select mb-3"
                            value={selectedMember?.id ?? 0}
                            onChange={handleSelectChange}
                        >
                            <option value={0}>Выберите участника</option>

                            {members.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.name}
                                </option>
                            ))}
                        </select>

                        <h6 className="mb-3">
                            Или введите своё ФИО, если Вас нет в списке
                        </h6>

                        <input
                            data-testid="member-name-input"
                            type="text"
                            className="form-control mb-4"
                            placeholder="Введите ФИО"
                            value={customName}
                            onChange={handleInputChange}
                        />

                        <button
                            data-testid="member-access-submit"
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Отправка..." : "Отправить запрос"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
