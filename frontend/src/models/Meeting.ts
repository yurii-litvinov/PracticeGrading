import {StudentWork} from './StudentWork';
import {Member} from './Member';
import {CriteriaGroup} from './CriteriaGroup';

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
 * @param criteriaGroup - Meeting criteria group
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
    criteriaGroup?: CriteriaGroup
}