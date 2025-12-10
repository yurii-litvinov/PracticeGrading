import { useState, useEffect, useRef } from 'react';
import { Member } from '../models/Member';
import { searchMembers } from '../services/ApiService';

export function useMemberSearch(searchName: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const pageSize = 10;
  const previousSearchRef = useRef('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const isFirstRender = useRef(true);

  const loadMembers = async (currentOffset: number, append: boolean = false) => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    }
    
    const trimmedSearch = searchName.trim();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setIsLoading(true);

    try {
      const response = await searchMembers(
        trimmedSearch,
        currentOffset,
        pageSize,
        abortControllerRef.current.signal,
      );

      const { members: newMembers, hasMore: moreAvailable } = response.data;

      setMembers(append ? prev => [...prev, ...newMembers] : newMembers);
      setHasMore(moreAvailable);
      setOffset(currentOffset + newMembers.length);
    }
    catch (error: any) {
      if (error.name !== 'CanceledError') {
        console.log(error);
      }
    }
    finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (!hasMore || isLoading) return;
    loadMembers(offset, true);
  };

  const reload = () => {
    loadMembers(0, false);
  };

  useEffect(() => {
    const trimmedSearch = searchName.trim();

    if (trimmedSearch === previousSearchRef.current && !isFirstRender.current) {
      return;
    }

    previousSearchRef.current = trimmedSearch;

    const timeoutId = setTimeout(() => {
      loadMembers(0, false);
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchName]);

  return {
    members,
    isLoading,
    hasMore,
    offset,
    loadMore,
    reload,
  };
}