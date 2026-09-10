import {type FormEvent, useEffect, useState} from 'react';
import {jwtDecode} from 'jwt-decode';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import {changePassword, createAdmin} from '../services/ApiService';

export function ProfilePage() {
    const [username, setUsername] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const [newAdminUserName, setNewAdminUserName] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [newAdminPasswordConfirmation, setNewAdminPasswordConfirmation] = useState('');
    const [adminCreationCurrentPassword, setAdminCreationCurrentPassword] = useState('');
    const [adminCreationError, setAdminCreationError] = useState('');
    const [adminCreationSuccess, setAdminCreationSuccess] = useState('');
    const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem('token');

        if (token) {
            const decoded = jwtDecode<Record<string, string>>(token);
            const name = decoded[
                'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
            ];

            setUsername(name ?? '');
        }
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        navigate('/login', {replace: true});
    };

    const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setPasswordError('');
        setPasswordSuccess('');

        if (!currentPassword) {
            setPasswordError('Введите текущий пароль.');
            return;
        }

        if (newPassword.length < 12) {
            setPasswordError('Новый пароль должен содержать не менее 12 символов.');
            return;
        }

        if (newPassword === currentPassword) {
            setPasswordError('Новый пароль должен отличаться от текущего.');
            return;
        }

        if (newPassword !== passwordConfirmation) {
            setPasswordError('Новые пароли не совпадают.');
            return;
        }

        setIsChangingPassword(true);

        try {
            await changePassword(currentPassword, newPassword);

            setCurrentPassword('');
            setNewPassword('');
            setPasswordConfirmation('');
            setPasswordSuccess('Пароль успешно изменён.');
        } catch {
            setPasswordError('Не удалось изменить пароль. Проверьте текущий пароль.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleCreateAdmin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setAdminCreationError('');
        setAdminCreationSuccess('');

        const userName = newAdminUserName.trim();

        if (!userName) {
            setAdminCreationError('Введите логин нового администратора.');
            return;
        }

        if (newAdminPassword.length < 12) {
            setAdminCreationError('Пароль должен содержать не менее 12 символов.');
            return;
        }

        if (newAdminPassword !== newAdminPasswordConfirmation) {
            setAdminCreationError('Пароли нового администратора не совпадают.');
            return;
        }

        if (!adminCreationCurrentPassword) {
            setAdminCreationError('Введите свой текущий пароль.');
            return;
        }

        setIsCreatingAdmin(true);

        try {
            await createAdmin(
                userName,
                newAdminPassword,
                adminCreationCurrentPassword,
            );

            setNewAdminUserName('');
            setNewAdminPassword('');
            setNewAdminPasswordConfirmation('');
            setAdminCreationCurrentPassword('');
            setAdminCreationSuccess('Новый администратор успешно создан.');
        } catch (requestError) {
            if (
                axios.isAxiosError(requestError) &&
                requestError.response?.status === 409
            ) {
                setAdminCreationError('Пользователь с таким логином уже существует.');
            } else if (
                axios.isAxiosError(requestError) &&
                requestError.response?.status === 400
            ) {
                setAdminCreationError('Проверьте свой текущий пароль.');
            } else {
                setAdminCreationError('Не удалось создать администратора.');
            }
        } finally {
            setIsCreatingAdmin(false);
        }
    };

    return (
        <div>
            <h3 className="mb-4">Пользователь: {username}</h3>

            <div className="row g-4">
                <div className="col-12 col-lg-6">
                    <div className="card h-100">
                        <div className="card-body">
                            <h4 className="card-title mb-3">
                                Изменение пароля
                            </h4>

                            {passwordError && (
                                <div className="alert alert-danger">
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="alert alert-success">
                                    {passwordSuccess}
                                </div>
                            )}

                            <form onSubmit={handleChangePassword}>
                                <div className="mb-3">
                                    <label
                                        htmlFor="current-password"
                                        className="form-label"
                                    >
                                        Текущий пароль
                                    </label>
                                    <input
                                        id="current-password"
                                        type="password"
                                        className="form-control"
                                        autoComplete="current-password"
                                        value={currentPassword}
                                        onChange={(event) =>
                                            setCurrentPassword(event.target.value)
                                        }
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label
                                        htmlFor="new-password"
                                        className="form-label"
                                    >
                                        Новый пароль
                                    </label>
                                    <input
                                        id="new-password"
                                        type="password"
                                        className="form-control"
                                        autoComplete="new-password"
                                        value={newPassword}
                                        onChange={(event) =>
                                            setNewPassword(event.target.value)
                                        }
                                        minLength={12}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label
                                        htmlFor="password-confirmation"
                                        className="form-label"
                                    >
                                        Повторите новый пароль
                                    </label>
                                    <input
                                        id="password-confirmation"
                                        type="password"
                                        className="form-control"
                                        autoComplete="new-password"
                                        value={passwordConfirmation}
                                        onChange={(event) =>
                                            setPasswordConfirmation(event.target.value)
                                        }
                                        minLength={12}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isChangingPassword}
                                >
                                    {isChangingPassword
                                        ? 'Изменение...'
                                        : 'Изменить пароль'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-lg-6">
                    <div className="card h-100">
                        <div className="card-body">
                            <h4 className="card-title mb-3">
                                Создание администратора
                            </h4>

                            {adminCreationError && (
                                <div className="alert alert-danger">
                                    {adminCreationError}
                                </div>
                            )}

                            {adminCreationSuccess && (
                                <div className="alert alert-success">
                                    {adminCreationSuccess}
                                </div>
                            )}

                            <form onSubmit={handleCreateAdmin}>
                                <div className="mb-3">
                                    <label
                                        htmlFor="new-admin-username"
                                        className="form-label"
                                    >
                                        Логин нового администратора
                                    </label>
                                    <input
                                        id="new-admin-username"
                                        type="text"
                                        className="form-control"
                                        autoComplete="off"
                                        value={newAdminUserName}
                                        onChange={(event) =>
                                            setNewAdminUserName(event.target.value)
                                        }
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label
                                        htmlFor="new-admin-password"
                                        className="form-label"
                                    >
                                        Пароль нового администратора
                                    </label>
                                    <input
                                        id="new-admin-password"
                                        type="password"
                                        className="form-control"
                                        autoComplete="new-password"
                                        value={newAdminPassword}
                                        onChange={(event) =>
                                            setNewAdminPassword(event.target.value)
                                        }
                                        minLength={12}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label
                                        htmlFor="new-admin-password-confirmation"
                                        className="form-label"
                                    >
                                        Повторите пароль нового администратора
                                    </label>
                                    <input
                                        id="new-admin-password-confirmation"
                                        type="password"
                                        className="form-control"
                                        autoComplete="new-password"
                                        value={newAdminPasswordConfirmation}
                                        onChange={(event) =>
                                            setNewAdminPasswordConfirmation(
                                                event.target.value,
                                            )
                                        }
                                        minLength={12}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label
                                        htmlFor="admin-creation-current-password"
                                        className="form-label"
                                    >
                                        Ваш текущий пароль
                                    </label>
                                    <input
                                        id="admin-creation-current-password"
                                        type="password"
                                        className="form-control"
                                        autoComplete="current-password"
                                        value={adminCreationCurrentPassword}
                                        onChange={(event) =>
                                            setAdminCreationCurrentPassword(
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isCreatingAdmin}
                                >
                                    {isCreatingAdmin
                                        ? 'Создание...'
                                        : 'Создать администратора'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <button
                className="btn btn-outline-danger mt-4"
                id="exit"
                onClick={handleLogout}
            >
                Выйти
            </button>
        </div>
    );
}