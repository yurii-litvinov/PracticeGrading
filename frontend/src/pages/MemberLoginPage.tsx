import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { getMembers, loginMember, setAuthHeader } from '../services/ApiService';
import { Member } from '../models/Member';

export function MemberLoginPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [customName, setCustomName] = useState<string>('');

    useEffect(() => {
        getMembers(Number(id)).then(response => {
            setMembers(response.data);

            if (response.data.length > 0) {
                setSelectedMember(members[0]);
            }
        });
    }, [id]);

    const handleLogin = async () => {
        const credentials = customName.trim()
            ? { userName: customName }
            : selectedMember
                ? { member: selectedMember }
                : null;

        if (!credentials) {
            alert('Выберите себя из списка или введите ФИО');
            return;
        }

        const response = await loginMember(Number(id), credentials);
        const token = response.data.token;
        sessionStorage.setItem('token', token);
        setAuthHeader(token);
        navigate(`/meetings/${id}/member`, { replace: true });
    }

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = parseInt(e.target.value);
        if (selectedId === 0 ) {
            setSelectedMember(null);
            return;
        }
        const member = members.find(m => m.id === selectedId);

        setSelectedMember(member || null);
        setCustomName('');
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomName(e.target.value);
        setSelectedMember(null);
    }

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
            <div className="card w-auto">
                <div className="card-body">
                    <h4 className="card-title text-center mb-4">Вход</h4>
                    <h6 className="mb-3">Выберите себя из списка</h6>

                    <select
                        className="form-select mb-3"
                        value={selectedMember?.id || ''}
                        onChange={handleSelectChange}
                    >
                        <option value={0}>Выберите участника</option>
                        {members.map((member) => (
                            <option key={member.id} value={member.id}>
                                {member.name}
                            </option>
                        ))}
                    </select>

                    <h6 className="mb-3">Или введите своё ФИО, если Вас нет в списке</h6>
                    <input
                        type="text"
                        className="form-control mb-4"
                        placeholder="Введите ФИО"
                        value={customName}
                        onChange={handleInputChange}
                    />

                    <div className="d-flex justify-content-center">
                        <button className="btn btn-primary w-100" onClick={handleLogin}>Войти
                            как {selectedMember?.name || customName}</button>
                    </div>
                </div>
            </div>
        </div>

    );
}