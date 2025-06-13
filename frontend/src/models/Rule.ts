/**
 * Interface for rule.
 *
 * @param id - Rule id
 * @param type - Rule type
 * @param description - Rule description
 * @param value - Rule value
 * @param isScaleRule - Value indicating whether rule is an element of the scale
 */
export interface Rule {
    id?: number,
    type?: string,
    description: string,
    value?: number,
    isScaleRule: boolean
}