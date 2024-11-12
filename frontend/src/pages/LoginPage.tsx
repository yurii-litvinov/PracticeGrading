import {useState} from 'react'
import {useNavigate} from 'react-router-dom';
import {loginAdmin, setAuthHeader} from '../services/apiService';

export function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();

        try {
            const response = await loginAdmin(username, password);
            const token = response.data.token;
            sessionStorage.setItem('token', token);
            setAuthHeader(token);
            navigate('/meetings', {replace: true});
        } catch (error) {
            alert('Неверный логин или пароль');
        }
    }

    return (
        <div className="d-flex justify-content-center align-items-center" style={{height: '100vh'}}>
            <div className="card" style={{width: '18rem'}}>
                <div className="card-body">
                    <h4 className="card-title text-center">Вход</h4>
                    <form onSubmit={handleLogin}>
                        <div className="mb-3">
                            <input
                                type="text"
                                className="form-control"
                                id="username"
                                placeholder="Логин"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <input
                                type="password"
                                className="form-control"
                                id="password"
                                placeholder="Пароль"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100">Войти</button>
                    </form>
                </div>
            </div>
        </div>
    );
}