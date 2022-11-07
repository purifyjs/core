// This is bad but good enough for now for testing and development
// TODO: Find a better way to do this
export function onNodeDestroy(node: Node, callback: () => void)
{
    (async () =>
    {
        while (getRootNode(node) === document)
        {
            await new Promise((resolve) => requestAnimationFrame(resolve))
        }
        console.log('destroyed', node)
        callback()
    })()
}

export function getRootNode(node: Node): Node
{
    if (node instanceof ShadowRoot) return getRootNode(node.host)
    if (node.parentNode) return getRootNode(node.parentNode)
    return node
}