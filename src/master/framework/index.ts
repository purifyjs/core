import { mountComponent } from "../component/mount"
import { Root } from "../components/root"

const root = await mountComponent(new Root(), document.querySelector("#app")!.firstElementChild!)
console.log(root, root.$component)