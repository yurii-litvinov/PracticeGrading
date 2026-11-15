import { MemberMergePanel } from "../components/MemberMergePanel";
import { useState } from "react";
import { MemberSearchList } from "../components/MemberSearchList";
import { Member } from "../models/Member";
import { MemberModal } from "../components/MemberModal";
import { addMember, deleteMember, updateMember } from "../services/ApiService";

export default function Members() {
    const [mergeReview, setMergeReview] = useState(false);
    const [merging, setMerging] = useState(false);
    const [mergeMembers, setMergeMembers] = useState<Member[]>([]);
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
        if (merging) {
            if (mergeReview) return;
            setMergeMembers(previous => previous.some(m => m.id === member.id) || previous.length >= 20 ? previous : [...previous, member]);
            return;
        }
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
            {!merging && <button className="btn btn-outline-primary mb-3" onClick={() => setMerging(true)}>Объединить пользователей</button>}
            {merging && <MemberMergePanel key={mergeMembers.map(m => m.id).join(',')} members={mergeMembers}
                onReviewChange={setMergeReview}
                onRemove={id => setMergeMembers(previous => previous.filter(m => m.id !== id))}
                onCancel={() => { setMerging(false); setMergeMembers([]); setMergeReview(false); }}
                onDone={() => { setMerging(false); setMergeMembers([]); setMergeReview(false); setReloadKey(k => k + 1); }} />}
            <MemberSearchList
                selectedMemberIds={merging ? mergeMembers.map(m => m.id!) : undefined}
                disabled={mergeReview}
                clickable={!mergeReview}
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
                onTrustedAccessChanged={() =>
                    setReloadKey(previous => previous + 1)
                }
            >

            </MemberModal>
        </>
    )
}