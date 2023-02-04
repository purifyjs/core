import { randomId } from "../../utils/id"
import { HtmlParse, HtmlParseStateType } from "./html"

export interface TemplateDescriptor
{
    template: HTMLTemplateElement
    valueDescriptors: TemplateValueDescriptor[]
    attributePartsMap: Map<string, Map<string, number[]>>
}

export const enum TemplateValueDescriptorType
{
    RenderNode,
    RenderComponent,
    Attribute,
    Directive
}

export interface TemplateValueDescriptor
{
    type: TemplateValueDescriptorType
    ref: string
    attribute: {
        type: string
        name: string
    }
    quote: '"' | "'" | ''
}

export function parseTemplateDescriptor<T extends HtmlParse[]>(parses: T): TemplateDescriptor
{
    let html = ''

    try
    {
        const attributePartsMap: Map<string, Map<string, number[]>> = new Map()
        const valueDescriptors: TemplateValueDescriptor[] = parses.map((parse, index) => 
        {
            html += parse.html

            if (parse.state.type === HtmlParseStateType.Outer)
            {
                const ref = randomId()
                html += `<x :ref="${ref}"></x>`
                return {
                    type: TemplateValueDescriptorType.RenderNode,
                    ref,
                    attribute: {
                        type: '',
                        name: ''
                    },
                    quote: ''
                }
            }
            else if (parse.state.type === HtmlParseStateType.TagInner && !parse.state.attribute_name)
            {
                if (parse.state.tag === 'x')
                {
                    return {
                        type: TemplateValueDescriptorType.RenderComponent,
                        ref: parse.state.tag_ref,
                        attribute: {
                            type: '',
                            name: ''
                        },
                        quote: ''
                    }
                }
            }
            else if (parse.state.type > HtmlParseStateType.ATTR_VALUE_START && parse.state.type < HtmlParseStateType.ATTR_VALUE_END)
            {
                const attributeNameParts = parse.state.attribute_name.split(':')
                const quote = parse.state.type === HtmlParseStateType.AttributeValueUnquoted ? '' : parse.state.type === HtmlParseStateType.AttributeValueSingleQuoted ? "'" : '"'
                if (attributeNameParts.length === 2)
                {
                    if (parse.state.type !== HtmlParseStateType.AttributeValueUnquoted)
                        throw new Error('Directive value must be unquoted')
                    html += `""`
                    const type = attributeNameParts[0]!
                    const name = attributeNameParts[1]!
                    return {
                        type: TemplateValueDescriptorType.Directive,
                        ref: parse.state.tag_ref,
                        attribute: {
                            type,
                            name
                        },
                        quote
                    }
                }
                else
                {
                    const name = attributeNameParts[0]!
                    if (quote === '') html += `""`
                    else 
                    {
                        html += parse.state.tag_ref // using the tag ref as a separator or placeholder for the signal value
                        const attributeMap = attributePartsMap.get(parse.state.tag_ref) ?? attributePartsMap.set(parse.state.tag_ref, new Map()).get(parse.state.tag_ref)!
                        const attributePartArray = attributeMap.get(name) ?? attributeMap.set(name, []).get(name)!
                        attributePartArray.push(index)
                    }
                    return {
                        type: TemplateValueDescriptorType.Attribute,
                        ref: parse.state.tag_ref,
                        attribute: {
                            type: '',
                            name
                        },
                        quote
                    }
                }
            }

            throw new Error(`Unexpected value`)
        })

        const template = document.createElement('template')
        template.innerHTML = html

        return {
            template,
            valueDescriptors,
            attributePartsMap
        }
    }
    catch (error)
    {
        if (error instanceof Error)
            throw new Error(`Error while parsing template: ${error.message}. \nAt:\n${html.slice(-256).trim()}`)
        throw new Error(`Unknown error while parsing template. \nAt:\n${html.slice(-256).trim()}`)
    }
}