import {Criteria} from './Criteria'
import {MarkScale} from './MarkScale'

/**
 * Interface for criteria group.
 *
 * @param id - Group id
 * @param name - Group name
 * @param metricType - Group metric type
 * @param criteria - List of group criteria
 * @param markScales - List of group scales
 */
export interface CriteriaGroup {
    id?: number,
    name: string,
    metricType: number,
    criteria: Criteria[],
    markScales: MarkScale[]
}