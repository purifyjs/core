import { parseTemplateDescriptor } from "./descriptor";
import { parseTemplate } from "./template";
import { parseTemplateHtml } from "./html";

export namespace parse
{
    export const template = parseTemplate
    export const descriptor = parseTemplateDescriptor
    export const html = parseTemplateHtml
}