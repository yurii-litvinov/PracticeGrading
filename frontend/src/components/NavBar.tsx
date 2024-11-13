import {NavLink} from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

export function NavBar() {
    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container-fluid">
                <NavLink className="navbar-brand" to="/meetings" replace>Practice Grading</NavLink>
                <button
                    className="navbar-toggler"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                    aria-controls="navbarNav"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
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
                            >
                                Заседания
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink
                                to="/profile"
                                className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}
                                replace
                            >
                                Профиль
                            </NavLink>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}
