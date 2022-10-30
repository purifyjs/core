import type { Serializable } from "../utils/serialize"

export type TemplateAccepts = Serializable
export class Template
{
    constructor(
        public readonly parts: TemplateStringsArray,
        public readonly values: TemplateAccepts[]
    ) {}
}
export function html(htmlParts: TemplateStringsArray, ...values: TemplateAccepts[]): Template
{
    return new Template(htmlParts, values)
}