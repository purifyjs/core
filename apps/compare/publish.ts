import { exec } from "child_process"
import fs from "fs/promises"
import { create } from "ipfs-http-client"
import path from "path"
import util from "util"

const execPromise = util.promisify(exec)

const ipfs = create({ url: `http://${await getHostIP()}:5001` })
const filePath = path.resolve("./dist/index.html")
const readmePath = path.resolve("../../README.md")
// const ipnsKeyName = "purifyjs-compare"

const hostIP = await getHostIP()
if (!hostIP) {
    throw new Error("Could not retrieve host IP. Exiting.")
}

console.log("Pinning file...")
const file = await fs.readFile(filePath)
const { cid } = await ipfs.add(file)
console.log("Pinned file CID:", cid.toString())

console.log("Updating README.md...")
const readmeContent = await fs.readFile(readmePath, { encoding: "utf8" })
{
    const prefix = "[Compare Syntax]("
    const suffix = ")"

    let start = readmeContent.indexOf(prefix)
    if (start < 0) {
        throw new Error("Prefix not found.")
    }
    start += prefix.length
    let end = readmeContent.indexOf(suffix, start)

    const readmeContentUpdated = `${readmeContent.slice(0, start)}https://${cid.toV1()}.ipfs.dweb.link${readmeContent.slice(end)}`

    await fs.writeFile(readmePath, readmeContentUpdated)

    console.log("Updated README.md...")
}

/* console.log("Updating IPNS record to:", cid)
const result = await ipfs.name.publish(cid, { key: ipnsKeyName })
console.log("IPNS record updated to:", result.value) */

async function getHostIP() {
    try {
        const { stdout } = await execPromise("ip route | awk 'NR==1 {print $3}'")
        return stdout.trim()
    } catch (error) {
        console.error("Error getting host IP:", error)
        return null
    }
}
