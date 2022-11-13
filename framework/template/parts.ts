import { randomId } from "../../utils/id"

export const enum TemplateStateType
{
    Outer,

    TAG_START,
    TagInner,
    TagName,
    TagClose,
    TAG_END,

    ATTR_START,
    AttributeName,
    ATTR_VALUE_START,
    AttributeValueUnquoted,

    ATTR_VALUE_QUOTED_START,
    AttributeValueSingleQuoted,
    AttributeValueDoubleQuoted,
    ATTR_VALUE_QUOTED_END,
    ATTR_VALUE_END,
    ATTR_END
}

export interface TemplateState
{
    type: TemplateStateType
    tag: string
    tag_ref: string
    attribute_name: string
    attribute_value: string
}

export interface TemplatePart
{
    html: string
    state: TemplateState
}

export function parseTemplateParts(arr: TemplateStringsArray)
{
    const templateParts: TemplatePart[] = []

    const state: TemplateState = {
        type: TemplateStateType.Outer,
        tag: '',
        tag_ref: '',
        attribute_name: '',
        attribute_value: ''
    }

    for (let i = 0; i < arr.length; i++)
    {
        const part = arr[i]
        let html = ''

        for (const char of part)
        {
            html = processChar(char, html, state)
        }

        templateParts.push({
            html,
            state: { ...state }
        })
    }
    return templateParts
}

function processChar(char: string, html: string, state: TemplateState)
{
    switch (state.type)
    {
        case TemplateStateType.Outer:
            if (char === '<')
            {
                state.type = TemplateStateType.TagName
                state.tag = ''
                state.tag_ref = randomId()
                state.attribute_name = ''
                state.attribute_value = ''
            }
            break
        case TemplateStateType.TagName:
            if (state.tag === '' && char === '/')
            {
                state.type = TemplateStateType.TagClose
                state.tag = ''
            }
            else if (char === '>')
            {
                state.type = TemplateStateType.Outer
                /* html += ` ::ref="${ref}"` */
            }
            else if (char === ' ')
            {
                state.type = TemplateStateType.TagInner
                html += ` ::ref="${state.tag_ref}"`
            }
            else state.tag += char
            break
        case TemplateStateType.TagInner:
            if (char === '>') state.type = TemplateStateType.Outer
            else if (char === ' ') state.type = TemplateStateType.TagInner
            else
            {
                state.type = TemplateStateType.AttributeName
                state.attribute_name = char
            }
            break
        case TemplateStateType.TagClose:
            if (char === '>')
            {
                state.type = TemplateStateType.Outer
                state.tag = ''
            }
            else state.tag += char
            break
        case TemplateStateType.AttributeName:
            if (char === '>') state.type = TemplateStateType.Outer
            else if (char === ' ') state.type = TemplateStateType.TagInner
            else if (char === '=')
            {
                state.type = TemplateStateType.AttributeValueUnquoted
                state.attribute_value = ''
            }
            else state.attribute_name += char
            break
        case TemplateStateType.AttributeValueUnquoted:
            if (char === '>') state.type = TemplateStateType.Outer
            else if (char === ' ') state.type = TemplateStateType.TagInner
            else if (char === '"')
            {
                state.type = TemplateStateType.AttributeValueDoubleQuoted
                state.attribute_value = ''
            }
            else if (char === "'")
            {
                state.type = TemplateStateType.AttributeValueSingleQuoted
                state.attribute_value = ''
            }
            else state.attribute_value += char
            break
        case TemplateStateType.AttributeValueSingleQuoted:
            if (char === "'") state.type = TemplateStateType.TagInner
            else state.attribute_value += char
            break
        case TemplateStateType.AttributeValueDoubleQuoted:
            if (char === '"') state.type = TemplateStateType.TagInner
            else state.attribute_value += char
            break
    }

    return `${html}${char}`
}