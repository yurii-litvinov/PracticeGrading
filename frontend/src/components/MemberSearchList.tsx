import { useMemberSearch } from '../hooks/useMemberSearch';
import { MemberList } from './MemberList';
import { Member } from '../models/Member';
import { useEffect } from 'react';

interface MemberSearchListProps {
  value: string;
  onChange: (value: string) => void;

  clickable?: boolean;
  onMemberClick?: (member: Member) => void;

  onAddClick?: () => void;

  reloadKey?: number;

  disabled?: boolean;
  placeholder?: string;
  maxHeight?: string | number | 'unlimited';
}

export function MemberSearchList({
  value,
  onChange,

  clickable = true,
  onMemberClick,

  onAddClick,

  reloadKey,

  disabled = false,
  placeholder = "Поиск членов комиссии...",
  maxHeight = 'unlimited',
}: MemberSearchListProps) {
  const { members, isLoading, hasMore, loadMore, reload } = useMemberSearch(value);

  useEffect(() => {
    reload();
  }, [reloadKey]);

  return (
    <div className="member-search-list">
      <div className="search-input-wrapper mb-4">
        <div className="input-group">
          <input
            type="text"
            value={value}
            id="search-input"
            onChange={(e) => onChange(e.target.value)}
            className="form-control"
            placeholder={placeholder}
            disabled={disabled}
            style={{
              borderTopRightRadius: '0',
              borderBottomRightRadius: '0'
            }}
          />
          <button
            id="add-member-button"
            className="btn btn-success px-4"
            type="button"
            onClick={onAddClick}
            disabled={disabled}
            style={{
              borderTopLeftRadius: '0',
              borderBottomLeftRadius: '0',
              fontSize: '16px',
              fontWeight: '500',
              padding: '10px 24px',
              marginLeft: '1px'
            }}
          >
            <i className="bi bi-plus-lg me-2"></i>
            Добавить
          </button>
        </div>
      </div>

      <MemberList
        members={members}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}

        clickable={clickable}
        onMemberClick={onMemberClick}

        maxHeight={maxHeight}
      />
    </div>
  );
}