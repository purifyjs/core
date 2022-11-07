// This is bad but good enough for now for testing and development
// TODO: Find a better way to do this
export function onNodeDestroy(node: Node, callback: () => void)
{
    (async () =>
    {
        while (getRootNode(node) !== null)
            await new Promise((resolve) => requestAnimationFrame(resolve))
        console.log('destroyed', node)
        callback()
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