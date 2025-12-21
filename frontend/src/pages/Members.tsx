import { useState } from "react";
import { MemberSearchList } from "../components/MemberSearchList";
import { Member } from "../models/Member";
import { MemberModal } from "../components/MemberModal";
import { addMember, deleteMember, updateMember } from "../services/ApiService";

export default function Members() {
    const [search, setSearch] = useState("");
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalRequestLoading, setIsModalRequestLoading] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    const handleClose = () => {
        setSelectedMember(null);
        setIsModalOpen(false);
    }

    const handleMemberClick = (member: Member) => {
        setSelectedMember(member)
        setIsModalOpen(true);
    }

    const handleEditMember = async (member: Member) => {
        try {
            setIsModalRequestLoading(true);
            if (member.id) {
                await updateMember(member);
                setIsModalRequestLoading(false);

                setReloadKey(prev => prev + 1);
                handleClose();
                return;
            }

            await addMember(member);

        }
        finally {
            setIsModalRequestLoading(false);
            setReloadKey(prev => prev + 1);
            handleClose();
        }
    }

    const handleDeleteMember = async (id: number) => {
        try {
            setIsModalRequestLoading(true);
            await deleteMember(id)
        }
        finally {
            setIsModalRequestLoading(false);
            setReloadKey(prev => prev + 1);
            handleClose();
        }
    }

    return (
        <>
            <MemberSearchList
                value={search}
                onChange={setSearch}
                onMemberClick={handleMemberClick}
                reloadKey={reloadKey}
                onAddClick={() => setIsModalOpen(true)}>
            </MemberSearchList>
            <MemberModal
                member={selectedMember || { name: search }}
                isOpen={isModalOpen}
                onClose={handleClose}
                isLoading={isModalRequestLoading}
                onSave={handleEditMember}
                onDelete={handleDeleteMember}
            >

            </MemberModal>
        </>
    )
}