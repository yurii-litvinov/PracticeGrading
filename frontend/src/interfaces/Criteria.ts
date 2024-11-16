import {Rule} from './Rule'

// Interface for criteria
export interface Criteria {
    id: number,
    name: string,
    comment: string,
    scale: Rule[],
    rules: Rule[]
}