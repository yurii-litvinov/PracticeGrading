import {NavLink} from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import {jwtDecode} from "jwt-decode";

export function NavBar() {
    const token = sessionStorage.getItem('token');
    let role = '';
    if (token) {
        const decoded = jwtDecode(token);
        role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    }

    if (role === "admin") {
        return (
            <nav className="navbar navbar-expand-sm navbar-dark bg-dark">
                <div className="container-fluid">
                    <NavLink className="navbar-brand fs-4" to="/meetings" replace id="nav-brand">Practice
                        Grading</NavLink>
                    <button
                        className="navbar-toggler"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNav"
                        aria-controls="navbarNav"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                        id="navbar-toggler"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav ms-auto">
                            <li className="nav-item">
                                <NavLink
                                    to="/meetings"
                                    end
                                    className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}
                                    replace
                                    id="meetings-link"
                                >
                                    Заседания
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink
                                    to="/criteria"
                                    className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}
                                    replace
                                    id="criteria-link"
                                >
                                    Критерии
                                </NavLink>
                            </li>
                            <li className="nav-item">
                                <NavLink
                                    to="/profile"
                                    className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}
                                    replace
                                    id="profile-link"
                                >
                                    Профиль
                                </NavLink>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        );
    } else {
        return (
            <nav className="navbar navbar-expand-sm navbar-dark bg-dark">
                <div className="container-fluid">
                    <div className="d-flex justify-content-center w-100">
                        <span className="navbar-brand fs-4">Заседание</span>
                    </div>
                </div>
            </nav>
        );
    }
}
