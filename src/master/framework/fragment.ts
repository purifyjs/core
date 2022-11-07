import { randomId } from "../utils/id"
import { onNodeDestroy } from "../utils/node"
import type { MasterElementProps } from "./element"
import type { MasterTemplate } from "./template"

export type FragmentMountCallback = ({ mountPoint }: { mountPoint: Element }) => Promise<void> | void
export type FragmentDestroyCallback = () => void
export type FragmentTemplate<Props extends MasterElementProps> = (params: { props: Props, onMount(callback: FragmentMountCallback): void, onDestroy(callback: FragmentDestroyCallback): void }) => MasterTemplate

export function defineFragment<Props extends MasterElementProps>(fragmentTemplate: FragmentTemplate<Props>)
{
    const typeId = randomId()

    return (props: Props) =>
    {
        const comment = `fragment ${typeId}`
        const startComment = document.createComment(comment)
        const endComment = document.createComment(`/${comment}`)

        const mountCallbacks: FragmentMountCallback[] = []
        const destroyCallbacks: FragmentDestroyCallback[] = []

        const template = fragmentTemplate({
            props,
            onMount(callback) { mountCallbacks.push(callback) },
            onDestroy(callback) { destroyCallbacks.push(callback) },
        })

        template.prepend(startComment)
        template.append(endComment)

        const templateMountCache = template.$mount
        Object.defineProperty(template, '$mount', {
            value: async (mountPoint: Element) =>
            {
                await templateMountCache.call(template, mountPoint)
                for (const callback of mountCallbacks) await callback({ mountPoint })
                onNodeDestroy(startComment, () =>
                {
                    for (const callback of destroyCallbacks) callback()
                })
            },
            writable: false
        })

        return template
    }
}
