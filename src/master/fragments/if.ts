import { html, MasterFragment } from "../framework/fragment"
import { Signal } from "../framework/signal"
import { onNodeDestroy } from "../utils/node"

export function If(condition: Signal<any> | any, then: MasterFragment, else_?: MasterFragment)
{
    if (condition instanceof Signal)
    {
        const startComment = document.createComment('if')
        const endComment = document.createComment('/if')
        const startCommentFragment = document.createDocumentFragment()
        startCommentFragment.append(startComment)
        const fragmentDerive = condition.derive((v) => v ? then : else_ ?? null)
        onNodeDestroy(startComment, () => fragmentDerive.cleanup())
        return html`${startCommentFragment}${fragmentDerive}${endComment}`
    }
    return condition ? then : else_ ?? null
}