import { useState } from 'react';
import MemberSearch from '../components/MemberSearch'
import Button from '../components/Button'
import { Member } from '../models/Member'
import MemberForm, { MemberFormMode } from '../components/MemberForm'
import { updateMember, addMember, deleteMember } from '../services/ApiService'

export default function Members() {
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [mode, setMode] = useState(MemberFormMode.VIEW);
    const [searchName, setSearchName] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    const handleMemberSelect = (member: Member) => {
        setSearchName(member.name.trim());
        setSelectedMember(member);
    };

    const handleSearchChange = (searchValue: string) => {
        if (selectedMember && (searchValue.trim() != selectedMember?.name.trim())) {
            setSelectedMember(null);
        }
        setSearchName(searchValue);
    }

    const handleEditButtonClick = () => {
        if (mode != MemberFormMode.VIEW) {
            return;
        }

        setMode(MemberFormMode.EDIT);
    }

    const handleAddButtonClick = () => {
        if (mode != MemberFormMode.VIEW) {
            return;
        }
        if (selectedMember) {
            if (!confirm("Обратите внимание, пользователь с таким ФИО уже существует, хотите продолжить?")) {
                return;
            }
        }

        setMode(MemberFormMode.ADD)
    }

    const handleDeleteButtonClick = async () => {
        if (!selectedMember || !selectedMember.id || mode != MemberFormMode.VIEW) {
            return;
        }

        await deleteMember(selectedMember.id)
        setSearchName('');
        setSelectedMember(null);
    }

    const handleFormCancel = () => {
        setMode(MemberFormMode.VIEW);
    }

    const handleFormSave = async (member: Member) => {
        if (mode === MemberFormMode.VIEW) {
            return;
        }

        if (mode === MemberFormMode.EDIT) {
            await updateMember(member);
        } else {
            const newMemberId = (await addMember(member)).data.id;
            if (!newMemberId) {
                setSelectedMember(null);
                setSearchName('');
                return;
            }

            member.id = newMemberId;
        }

        setSelectedMember(member);
        setSearchName(member.name);
        if (searchName.trim() === member.name.trim()) {
            setReloadKey(prev => prev + 1);
        }
        setMode(MemberFormMode.VIEW);
    }

    return (
        <>
            <div className="d-flex align-items-center w-100">
                <div style={{ width: '70%' }}>
                    <MemberSearch
                        onMemberSelect={handleMemberSelect}
                        onSearchChange={handleSearchChange}
                        selectedMember={selectedMember}
                        searchName={searchName}
                        reloadKey={reloadKey}
                        disabled={mode != MemberFormMode.VIEW} />
                </div>

                <div className="d-flex ms-2" style={{ width: '30%', gap: '8px' }}>
                    <Button
                        variant={selectedMember ? "secondary" : "primary"}
                        outline={false}
                        disabled={mode != MemberFormMode.VIEW}
                        onClick={handleAddButtonClick}
                        className="flex-grow-1"
                        id={"add-member-button"}>
                        Добавить
                    </Button>

                    <Button variant={selectedMember ? "primary" : "secondary"}
                        outline={!selectedMember}
                        disabled={!selectedMember || mode != MemberFormMode.VIEW}
                        onClick={handleEditButtonClick}
                        className="flex-grow-1"
                        id={"edit-member-button"}>
                        Редактировать
                    </Button>
                    <Button variant={selectedMember ? "danger" : "secondary"}
                        outline={!selectedMember}
                        disabled={!selectedMember || mode != MemberFormMode.VIEW}
                        onClick={handleDeleteButtonClick}
                        className="flex-grow-1"
                        id ={"delete-member-button"}>
                        Удалить
                    </Button>
                </div>
            </div>
            <div className="mt-4">
                <MemberForm
                    member={selectedMember}
                    mode={mode}
                    searchName={searchName}
                    onCancel={handleFormCancel}
                    onSave={handleFormSave}
                />
            </div>
        </>
    )
}
