import { renderComponent } from "./master/component/render"
import { Root } from "./master/components/Root"

export async function render(url: string): Promise<string>
{
    return await renderComponent(new Root())
}