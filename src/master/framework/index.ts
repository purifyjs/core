import { mountComponent } from "../mount"
import { deserializeObject } from "../serialize"
import * as Test from "../test"

const windowAsAny = window as any
windowAsAny.$mountComponent = mountComponent
windowAsAny.$componentModules = {
    Test
}
windowAsAny.$deserializeObject = deserializeObject;

document.querySelectorAll('[component\\:id]').forEach((element) => {
    const component = mountComponent(Test, element)
})