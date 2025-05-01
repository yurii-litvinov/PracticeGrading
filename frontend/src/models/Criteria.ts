import {Rule} from './Rule'

/**
 * Interface for criteria.
 *
 * @param id - Criteria id
 * @param name - Criteria name
 * @param comment - Criteria comment
 * @param scale - List of criteria scale rules
 * @param rules - List of criteria rules
 */
export interface Criteria {
    id?: number,
    name: string,
    comment: string,
    scale: Rule[],
    rules: Rule[]
}