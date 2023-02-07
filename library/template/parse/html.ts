import { randomId } from "../../utils/id"

export interface TemplateHtmlParse
{
    parts: TemplateHtmlParsePart[]
}

export interface TemplateHtmlParsePart
{
    html: string
    state: HtmlParseState
}

export interface HtmlParseState
{
    type: HtmlParseStateType
    tag: string
    tag_ref: string
    attribute_name: string
    attribute_value: string
}

export const enum HtmlParseStateType
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

export function parseTemplateHtml(arr: TemplateStringsArray): TemplateHtmlParse
{
    const parses: TemplateHtmlParsePart[] = []

    const state: HtmlParseState = {
        type: HtmlParseStateType.Outer,
        tag: '',
        tag_ref: '',
        attribute_name: '',
        attribute_value: ''
    }

    for (let i = 0; i < arr.length; i++)
    {
        const parse = arr[i]!
        let html = ''

        for (let i = 0; i < parse.length; i++)
        {
            const char = parse[i]!
            try
            {
                html = processChar(char, html, state)
            }
            catch (e)
            {
                const errorHtml = '\n' + `${parses.map((part) => part.html).join('')}${html}{{{${char}}}}${parse.slice(i + 1)}`.trim() + '\n'
                if (e instanceof Error) throw new Error(`Parsing error:${e.message}\nAt:\n${errorHtml}`)
                throw new Error(`Unknown parsing error\nAt:\n${errorHtml}`)
            }
        }

        parses.push({
            html,
            state: { ...state }
        })
    }
    return {
        parts: parses
    }
}

function processChar(char: string, html: string, state: HtmlParseState)
{
    switch (state.type)
    {
        case HtmlParseStateType.Outer:
            if (char === '<')
            {
                state.type = HtmlParseStateType.TagName
                state.tag = ''
                state.tag_ref = randomId()
                state.attribute_name = ''
                state.attribute_value = ''
            }
            else if (/\s/.test(html[html.length - 1]!) && /\s/.test(char)) return html
            break
        case HtmlParseStateType.TagName:
            if (state.tag === '' && char === '/')
            {
                state.type = HtmlParseStateType.TagClose
                state.tag = ''
            }
            else if (char === '>')
            {
                state.type = HtmlParseStateType.Outer
                /* html += ` :ref="${ref}"` */
            }
            else if (/\s/.test(char))
            {
                state.type = HtmlParseStateType.TagInner
                html += ` :ref="${state.tag_ref}"`
            }
            else state.tag += char
            break
        case HtmlParseStateType.TagInner:
            if (char === '>') state.type = HtmlParseStateType.Outer
            else if (/\s/.test(char)) state.type = HtmlParseStateType.TagInner
            else
            {
                state.type = HtmlParseStateType.AttributeName
                state.attribute_name = char
            }
            break
        case HtmlParseStateType.TagClose:
            if (char === '>')
            {
                state.type = HtmlParseStateType.Outer
                state.tag = ''
            }
            else state.tag += char
            break
        case HtmlParseStateType.AttributeName:
            if (char === '>') state.type = HtmlParseStateType.Outer
            else if (/\s/.test(char)) state.type = HtmlParseStateType.TagInner
            else if (char === '=')
            {
                state.type = HtmlParseStateType.AttributeValueUnquoted
                state.attribute_value = ''
            }
            else state.attribute_name += char
            break
        case HtmlParseStateType.AttributeValueUnquoted:
            if (char === '>') state.type = HtmlParseStateType.Outer
            else if (/\s/.test(char)) state.type = HtmlParseStateType.TagInner
            else if (char === '"')
            {
                state.type = HtmlParseStateType.AttributeValueDoubleQuoted
                state.attribute_value = ''
            }
            else if (char === "'")
            {
                state.type = HtmlParseStateType.AttributeValueSingleQuoted
                state.attribute_value = ''
            }
            else 
            {
                throw new Error(`Unexpected character '${char}' in attribute value`)
                // state.attribute_value += char Not needed, causes complexity in parsing. Might be fixed later.
            }
            break
        case HtmlParseStateType.AttributeValueSingleQuoted:
            if (char === "'") state.type = HtmlParseStateType.TagInner
            else state.attribute_value += char
            break
        case HtmlParseStateType.AttributeValueDoubleQuoted:
            if (char === '"') state.type = HtmlParseStateType.TagInner
            else state.attribute_value += char
            break
    }

    return `${html}${char}`
}