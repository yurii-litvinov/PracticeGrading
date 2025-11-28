/**
 * Interface for member.
 *
 * @param id - Member id
 * @param name - Member name
 */
export interface Member {
    id?: number,
    name: string,
    informationRu?: string,
    informationEn?: string,
    phone?: string,
    email?: string,
}