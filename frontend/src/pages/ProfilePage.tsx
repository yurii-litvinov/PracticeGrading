import {useState, useEffect} from 'react';
import {jwtDecode} from "jwt-decode";
import {useNavigate} from 'react-router-dom';

export function ProfilePage() {
    const [username, setUsername] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem('token');
        if (token) {
            const decoded = jwtDecode(token);
            // @ts-ignore
            const name = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"];
            setUsername(name);
        }
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        navigate("/login", {replace: true});
    }

    return (
        <div className="container mt-4">
            <h3>Пользователь: {username}</h3>
            <button className="btn btn-outline-danger w-auto align-self-start" id = "exit" onClick={handleLogout}>
                Выйти
            </button>
        </div>
    );
}
