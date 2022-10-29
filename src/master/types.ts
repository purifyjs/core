import { TemplateFactory } from "./template"

export interface ComponentFactory
{
    mount(element: Element): Promise<Component>
    render(): Promise<string>
}

export interface ComponentModule
{
    default: TemplateFactory
    onMount?: () => Promise<void>
    onRender?: () => Promise<void>
}

export interface Component extends Element
{
    $component: {
        id: string
        instance: ComponentModule
    }
}