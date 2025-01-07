import {useState, useEffect} from 'react'
import {useNavigate, useParams} from 'react-router-dom';
import {getMembers, loginMember, setAuthHeader} from '../services/ApiService';

export function MemberLoginPage() {
    const {id} = useParams();
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState('');

    useEffect(() => {
        getMembers(id).then(response => {
            const membersList = response.data;
            const namesList = membersList.map(member => member.name);
            setMembers(namesList);

            if (namesList.length > 0) {
                setSelectedMember(namesList[0]);
            }
        });
    }, [id]);

    const handleLogin = async () => {
        if (selectedMember === '') {
            alert('Выберите себя из списка или введите ФИО');
        } else {
            const response = await loginMember(selectedMember, id);
            const token = response.data.token;
            sessionStorage.setItem('token', token);
            setAuthHeader(token);
            navigate(`/meetings/${id}/member`, {replace: true});
        }
    }

    return (
        <div className="d-flex justify-content-center align-items-center" style={{height: '100vh'}}>
            <div className="card w-auto">
                <div className="card-body">
                    <h4 className="card-title text-center mb-4">Вход</h4>
                    <h6 className="mb-3">Выберите себя из списка</h6>

                    <select
                        className="form-select mb-3"
                        value={selectedMember}
                        onChange={(e) => setSelectedMember(e.target.value)}
                    >
                        {members.map((member, index) => (
                            <option key={index} value={member}>
                                {member}
                            </option>
                        ))}
                    </select>

                    <h6 className="mb-3">Или введите своё ФИО, если Вас нет в списке</h6>
                    <input
                        type="text"
                        className="form-control mb-4"
                        placeholder="Введите ФИО"
                        onChange={(e) => setSelectedMember(e.target.value)}
                    />

                    <div className="d-flex justify-content-center">
                        <button className="btn btn-primary w-100" onClick={handleLogin}>Войти
                            как {selectedMember}</button>
                    </div>
                </div>
            </div>
        </div>

    );
}