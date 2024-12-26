/**
 * Interface for student work.
 *
 * @param studentName - Student name
 * @param theme - Student work theme
 * @param supervisor - Student work supervisor
 * @param consultant - Student work consultant
 * @param reviewer - Student work reviewer
 * @param supervisorMark - Student work supervisor mark
 * @param reviewerMark - Student work reviewer mark
 * @param codeLink - Student work code link
 */
export interface StudentWork {
    studentName: string,
    theme: string,
    supervisor: string,
    consultant?: string,
    reviewer?: string,
    supervisorMark?: number,
    reviewerMark?: number,
    codeLink?: string
}