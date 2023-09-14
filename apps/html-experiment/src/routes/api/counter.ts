const countFilepath = "/tmp/count.txt" as const

export async function GET() {
	const countFile = Bun.file(countFilepath)
	return (await countFile.exists()) ? parseInt(await countFile.text()) : 0
}

export async function POST({ direction }: Partial<{ direction: "add" | "subtract" }>) {
	const count = (await GET()) + (direction === "add" ? 1 : -1)
	await Bun.write(countFilepath, `${count}`)
	return await GET()
}
