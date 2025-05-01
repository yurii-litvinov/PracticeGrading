import {StudentWork} from './StudentWork';
import {Member} from './Member';
import {Criteria} from './Criteria';

/**
 * Interface for meeting.
 *
 * @param id - Meeting id
 * @param dateAndTime - Meeting date and time
 * @param auditorium - Meeting auditorium
 * @param info - Meeting info
 * @param callLink - Meeting callLink
 * @param materialsLink - Meeting materialsLink
 * @param studentWorks - List of meeting student works
 * @param members - List of meeting memebers
 * @param criteriaId - List of meeting criteria id
 */
export interface Meeting {
    id?: number,
    dateAndTime: Date,
    auditorium: string,
    info: string,
    callLink: string,
    materialsLink: string,
    studentWorks: StudentWork[],
    members: Member[],
    criteria: Criteria[]
}