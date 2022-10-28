import { PickRequired } from "typescript-util-types"
import { randomId } from "../utils/id"
import { Template } from "./template"

export type ComponentFunctions = {
    [functionId: string]: (event: Event) => void
}

export type AnyProps = Record<string, any>
export interface ComponentFactory<Props extends AnyProps = AnyProps>
{
    PROPS_TYPE: Props
    mount(props: Props, componentElement: HTMLElement): Promise<Component<ComponentFactory<Props>>>
    renderMount(props: Props, mountPoint: HTMLElement): Promise<Component<ComponentFactory<Props>>>
    unmount(): void
    render(props: Props): Promise<{ html: string, functions: ComponentFunctions }>
}

export interface Component<T extends ComponentFactory> extends HTMLElement
{
    $id: string
    $props: T['PROPS_TYPE']
    $functions: ComponentFunctions
}

export function makeComponent<T extends ComponentFactory>(element: HTMLElement, props: T['PROPS_TYPE'], functions: ComponentFunctions): Component<T>
{
    const component = element as Component<T>

    component.setAttribute('component:id', randomId())
    Object.defineProperty(component, '$id', { get() { return component.getAttribute('component:id')! } })

    component.$props = props
    component.$functions = functions

    component.querySelectorAll('[on:click]').forEach((element) => {
        element.addEventListener('click', (event) => {
            const value = element.getAttribute('on:click')!
            component.$functions[value]?.(event)
        })
    })

    return component
}

export function createComponentFactory<Props extends AnyProps>(defaultProps: PickRequired<Props>, templateRenderer: (props: Props) => Template): ComponentFactory<Props>
{
    type T = ComponentFactory<Props>
    const componentFactory: T = {
        PROPS_TYPE: null as any,
        async mount(props, componentElement)
        {
            props = { ...defaultProps, ...props }
            const component = makeComponent<T>(componentElement, props)
            return component
        },
        async renderMount(props, mountPoint)
        {
            props = { ...defaultProps, ...props }
            const componentElementWrapper = document.createElement('div')
            const rendered = await this.render(props);
            componentElementWrapper.innerHTML = rendered.html
            const componentElement = componentElementWrapper.firstElementChild as HTMLElement
            mountPoint.appendChild(componentElement)
            const component = makeComponent<T>(componentElement, props)
            return component
        },
        unmount()
        {
            throw new Error('Not implemented')
        },
        async render(props)
        {
            // Runs on server or client

            const componentFunctions: ComponentFunctions = {}

            const template = templateRenderer(props)
            const html = (await Promise.all(
                template.parts.map(async (part, index) =>
                {
                    part = part.trim()
                    const param = template.params[index]
                    if (!param) return part

                    let paramRef: string

                    if (typeof param === "string")
                    {
                        paramRef = param
                    }
                    else if (typeof param === "number")
                    {
                        paramRef = param.toString()
                    }
                    else if (typeof param === "function")
                    {
                        const functionId = randomId()
                        componentFunctions[functionId] = param
                        paramRef = functionId
                    }
                    else throw new Error("Invalid template param")

                    return `${part}${paramRef}`
                })
            )
            ).join("")

            return { html, functions: componentFunctions }
        }
    }

    return componentFactory
}