import { useState, useRef, useEffect } from 'react';
import { Member } from '../models/Member';
import { useMemberSearch } from '../hooks/useMemberSearch';

interface MemberSearchDropdownProps {
    value: string;
    onChange: (value: string) => void;
    onSelect: (member: Member) => void;
    placeholder?: string;
}

export function MemberSearchDropdown({
    value,
    onChange,
    onSelect,
    placeholder = "Поиск членов комиссии...",
}: MemberSearchDropdownProps) {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { members, isLoading, hasMore, loadMore } = useMemberSearch(value);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectMember = (member: Member) => {
        onSelect(member);
        setShowDropdown(false);
    };

    const handleInputFocus = () => {
        if (members.length > 0) {
            setShowDropdown(true);
        }
    };

    return (
        <div ref={dropdownRef} className="position-relative" style={{ width: '100%' }}>
            <input
                type="text"
                id="search-input"
                value={value}
                className="form-control"
                onChange={(e) => onChange(e.target.value)}
                onFocus={handleInputFocus}
                placeholder={placeholder}
                style={{ width: '100%', padding: '8px' }}
            />

            {showDropdown && (
                <div
                    className="dropdown-menu show w-100 mt-1 p-0"
                    style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                    }}
                >
                    {isLoading && members.length === 0 ? (
                        <div className="dropdown-item text-center">
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Загрузка...
                        </div>
                    ) : members.length === 0 ? (
                        <div className="dropdown-item text-muted text-center">
                            Не найдено
                        </div>
                    ) : (
                        <>
                            {members.map(member => (
                                <button
                                    key={member.id}
                                    disabled={isLoading}
                                    onClick={() => handleSelectMember(member)}
                                    className='dropdown-item'
                                    type="button"
                                >
                                    <div className="d-flex flex-column">
                                        <span className="fw-semibold">{member.name}</span>
                                        <small className='text-muted'>
                                            {member.email}
                                        </small>
                                    </div>
                                </button>
                            ))}

                            {hasMore && (
                                <>
                                    <div className="dropdown-divider my-1"></div>
                                    <div className="px-2 py-1">
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary w-100 btn-sm"
                                            onClick={loadMore}
                                            disabled={isLoading}
                                            style={{
                                                borderStyle: 'dashed',
                                                borderWidth: '1px',
                                                borderRadius: '6px',
                                                padding: '6px 12px',
                                                fontSize: '14px',
                                            }}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    Загрузка...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-plus-circle me-2"></i>
                                                    Показать еще
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}