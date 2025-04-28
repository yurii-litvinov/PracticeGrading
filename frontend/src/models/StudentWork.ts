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
    id?: number,
    studentName: string,
    theme: string,
    supervisor: string,
    consultant?: string,
    reviewer?: string,
    supervisorMark?: string,
    reviewerMark?: string,
    codeLink?: string,
    reportLink?: string,
    supervisorReviewLink?: string,
    consultantReviewLink?: string,
    reviewerReviewLink?: string,
    additionalLink?: string
}