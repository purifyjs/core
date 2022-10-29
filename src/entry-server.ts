import { renderComponent } from "./master/render"
import * as Test from "./master/test"

export async function render()
{
    return await renderComponent(Test)
}