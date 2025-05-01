import { CriteriaMark } from './CriteriaMark';

/**
 * Interface for member mark.
 *
 * @param id - Member mark id
 * @param memberId - Member id
 * @param studentWorkId - Student work id
 * @param criteriaMarks - List of criteria marks
 * @param mark - Member mark
 * @param comment - Member mark comment
 */
export interface MemberMark {
    id?: number;
    memberId: number;
    studentWorkId: number;
    criteriaMarks: CriteriaMark[];
    mark?: number;
    comment?: string;
}
