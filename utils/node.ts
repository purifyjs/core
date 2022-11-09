// This is bad but good enough for now for testing and development
// TODO: Find a better way to do this
export function onNodeUnmount(node: Node, callback: () => any)
{
    (async () =>
    {
        while (getRootNode(node) !== null)
            await new Promise((resolve) => requestAnimationFrame(resolve))
        console.log('Node unmounted', node)
        try { await callback() }
        catch (e) { console.error(e) }
    })()
}

export function getRootNode(node: Node): Node | null
{
    if (node === document) return node
    if (node instanceof DocumentFragment) return node
    if (node instanceof ShadowRoot) return getRootNode(node.host)
    if (node.parentNode) return getRootNode(node.parentNode)
    return null
}