import { useState, useEffect, useRef } from 'react';
import { Member } from '../models/Member';
import { searchMembers } from '../services/ApiService'

interface MemberSearchProps {
  onMemberSelect: (member: Member) => void;
  onSearchChange: (value: string) => void;
  selectedMember: Member | null;
  searchName: string
  disabled?: boolean
  reloadKey?: number
}

export default function MemberSearch({ onMemberSelect, onSearchChange, selectedMember, searchName: searchName, reloadKey, disabled = false }: MemberSearchProps) {
  const [foundMembers, setFoundMembers] = useState<Member[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const previousSearchRef = useRef('');

  useEffect(() => {
    let trimmedSearch = searchName.trim();

    if (trimmedSearch === previousSearchRef.current) {
      return;
    }

    previousSearchRef.current = trimmedSearch;

    if (!trimmedSearch) {
      setFoundMembers([]);
      setHasMore(false);
      setShowDropdown(false);
      setOffset(0)
      return;
    }

    const timeoutId = setTimeout(() => {
      loadMembers(trimmedSearch, 0, 10, false).then(() => {
        if (foundMembers.length === 1) {
          if (foundMembers[0].name.trim().toLowerCase() === trimmedSearch.toLowerCase()) {
            handleAutoSelect(foundMembers[0]);
          }
        }
      }
      );
    }, 300);

    return () => clearTimeout(timeoutId);

  }, [searchName]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  })

  useEffect(() => {
    loadMembers(searchName, 0, 10, false, false);
    setShowDropdown(false);
  }, [reloadKey])

  const loadMembers = async (searchName: string, offset: number, limit: number, needPreviousResult: boolean, needDropdown = true) => {
    if (!searchName) {
      return;
    }

    setIsLoading(true);
    try {
      let response = await searchMembers(searchName, offset, limit);
      const { members, hasMore } = response.data;
      setFoundMembers(needPreviousResult ? prev => [...prev, ...members] : members);
      setHasMore(hasMore);
      setShowDropdown(needDropdown && members.length > 0);
      setOffset(prev => prev + members.length);
    } catch (error) {
      console.error("Load error", error);
    } finally {
      setIsLoading(false);
    }
  }

  const loadMoreMembers = async () => {
    if (!hasMore || isLoading) {
      return;
    }

    loadMembers(searchName.trim(), offset, 10, true);
  };

  const handleSelectMember = (member: Member) => {
    onMemberSelect(member);
    setFoundMembers(foundMembers.filter(m => member.name.trim() === m.name.trim()));
    setShowDropdown(false);
    setHasMore(false);
  };

  const handleAutoSelect = (member: Member) => {
    onMemberSelect(member);
  }

  const handleInputFocus = () => {
    if (foundMembers.length > 0) {
      setShowDropdown(true);
    }
  }

  return (
    <>
      <div ref={dropdownRef} className="position-relative" style={{ width: '100%' }}>
        <input
          id="searchInput"
          type="text"
          value={searchName}
          className="form-control"
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={handleInputFocus}
          placeholder="Поиск членов..."
          disabled={disabled}
          style={{ width: '100%', padding: '8px' }}
        />

        {showDropdown && !disabled && (
          <div
            className="dropdown-menu show w-100 mt-1 p-0"
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
            }}>
            {!isLoading && foundMembers.map(member => (
              <button
                key={member.id}
                onClick={() => handleSelectMember(member)}
                className={"dropdown-item" + (member.id === selectedMember?.id ? " active" : "")}
              >
                <div className="d-flex flex-column">
                  <span className="fw-semibold">{member.name}</span>
                  <small className={selectedMember?.id === member.id ? "text-white-50" : "text-muted"}>{member.email}</small>
                </div>
              </button>
            ))}

            {!isLoading && hasMore && (
              <>
                <div className="dropdown-divider"></div>
                <button
                  type="button"
                  className="dropdown-item text-center text-primary fw-semibold"
                  onClick={loadMoreMembers}
                  disabled={isLoading}
                >
                  {isLoading ? 'Загрузка...' : `Загрузить еще`}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}