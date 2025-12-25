import { Member } from "../models/Member";
import { useState } from "react";

interface MemberListProps {
    members: Member[],
    isLoading?: boolean,
    hasMore?: boolean,
    onLoadMore?: () => void;

    clickable?: boolean
    onMemberClick?: (member: Member) => void;

    removable?: boolean,
    onMemberRemove?: (id: number | undefined) => void;

    maxHeight?: string | number | 'unlimited';
    showLoadMore?: boolean;
}

export function MemberList({
    members,
    isLoading = false,
    hasMore = false,
    onLoadMore,

    clickable = false,
    onMemberClick,

    removable = false,
    onMemberRemove,

    maxHeight = '300px',
    showLoadMore = true,
}: MemberListProps) {
    const [hoveredMemberId, setHoveredMemberId] = useState<number | null>(null);

    const getInitials = (name: string): string => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
    };

    const getAvatarColor = (id: number): string => {
        const colors = ['#0d6efd', '#198754', '#dc3545', '#6f42c1', '#fd7e14'];
        return colors[id % colors.length];
    };

    const handleMemberClick = (member: Member, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isLoading && clickable && onMemberClick) {
            onMemberClick(member);
        }
    };

    const handleRemoveClick = (member: Member, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isLoading && removable && onMemberRemove) {
            onMemberRemove(member.id);
        }
    };

    if (isLoading && members.length === 0) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary"></div>
                <p className="mt-3">Загрузка...</p>
            </div>
        );
    }

    if (members.length === 0) {
        return (
            <div className="text-center py-5 text-muted">
                Нет членов комиссии
            </div>
        );
    }

    const containerStyle = maxHeight === 'unlimited'
        ? {}
        : { maxHeight, overflowY: 'auto' as const };

    return (
        <div className="member-list">
            <div style={containerStyle}>
                {members.map(member => {
                    const isHovered = hoveredMemberId === member.id;

                    return (
                        <div
                            key={member.id}
                            className={`card mb-2 ${clickable ? 'cursor-pointer' : ''} ${isHovered && clickable ? 'border-primary shadow-sm' : ''
                                }`}
                            onClick={(e) => handleMemberClick(member, e)}
                            onMouseEnter={() => clickable && setHoveredMemberId(member.id!)}
                            onMouseLeave={() => clickable && setHoveredMemberId(null)}
                            style={{
                                cursor: clickable ? 'pointer' : 'default',
                                transition: 'all 0.2s ease',
                                transform: isHovered && clickable ? 'translateY(-1px)' : 'none',
                                borderLeft: isHovered && clickable ? '4px solid #0d6efd' : 'none'
                            }}
                        >
                            <div className="card-body py-2 d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center me-3"
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            fontSize: '12px',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            backgroundColor: getAvatarColor(member.id!),
                                            transition: 'all 0.2s ease',
                                            transform: isHovered && clickable ? 'scale(1.1)' : 'scale(1)'
                                        }}
                                    >
                                        {getInitials(member.name)}
                                    </div>

                                    <div>
                                        <h6 className={`card-title mb-0 ${isHovered && clickable ? 'text-primary' : ''}`}>
                                            {member.name}
                                        </h6>
                                        {member.email && (
                                            <small className={`${isHovered && clickable ? 'text-primary' : 'text-muted'}`}>
                                                {member.email}
                                            </small>
                                        )}
                                    </div>
                                </div>

                                {removable && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={(e) => handleRemoveClick(member, e)}
                                        title="Удалить"
                                        style={{
                                            width: '30px',
                                            height: '30px',
                                            padding: 0,
                                            opacity: isHovered ? 1 : 0.7,
                                            transition: 'opacity 0.2s ease'
                                        }}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {showLoadMore && hasMore && onLoadMore && (
                <div className="text-center mt-3">
                    <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={onLoadMore}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Загрузка...
                            </>
                        ) : (
                            'Показать еще'
                        )}
                    </button>
                </div>
            )}

            <style>{`
                .cursor-pointer:hover {
                    transition: all 0.2s ease;
                }
                .card {
                    transition: all 0.2s ease;
                }
            `}</style>
        </div>
    );
}