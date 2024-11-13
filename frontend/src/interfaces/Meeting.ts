import {StudentWork} from './StudentWork'

// Interface for meeting
export interface Meeting {
    dateAndTime: Date,
    auditorium: string,
    info: string,
    callLink: string,
    materialsLink: string,
    studentWorks: StudentWork[],
    members: string[]
}