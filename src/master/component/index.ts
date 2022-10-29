import type { Template } from "../template"

export interface Component<T extends ComponentInstance> extends Element
{
    $component: T
}

export abstract class ComponentInstance
{
    public id!: string
    abstract onMount(): Promise<void>
    abstract render(): Promise<Template>
}