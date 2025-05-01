/**
 * Interface for criteria mark.
 *
 * @param id - Criteria mark id
 * @param criteriaId - Criteria id
 * @param memberMarkId - Member mark id
 * @param comment - Member comment
 * @param selectedRules - List of selected rules
 * @param mark - Mark for the criteria
 */
export interface CriteriaMark {
    id?: number;
    criteriaId: number;
    memberMarkId: number;
    comment?: string;
    selectedRules: {ruleId: number, value?: number}[];
    mark?: number;
}
