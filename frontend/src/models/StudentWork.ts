/**
 * Interface for student work.
 *
 * @param studentName - Student name
 * @param info - Student info
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
    info: string,
    theme: string,
    supervisor: string,
    supervisorInfo?: string,
    consultant?: string,
    reviewer?: string,
    reviewerInfo?: string,
    supervisorMark?: string,
    reviewerMark?: string,
    codeLink?: string,
    finalMark: string,
    reportLink?: string,
    supervisorReviewLink?: string,
    consultantReviewLink?: string,
    reviewerReviewLink?: string,
    additionalLink?: string
    averageCriteriaMarks: any[]
}