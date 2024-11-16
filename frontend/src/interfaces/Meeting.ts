import {StudentWork} from './StudentWork';
import {Criteria} from './Criteria';

// Interface for meeting
export interface Meeting {
    dateAndTime: Date,
    auditorium: string,
    info: string,
    callLink: string,
    materialsLink: string,
    studentWorks: StudentWork[],
    members: string[],
    criteriaId: number[]
}