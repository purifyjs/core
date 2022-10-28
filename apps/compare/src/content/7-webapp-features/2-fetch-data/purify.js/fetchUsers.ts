export async function fetchUsers() {
	const response = await fetch(
		"https://randomuser.me/api/?results=3",
	);
	const data = (await response.json()) as {
		picture: { thumbnail: string };
		name: { first: string; last: string };
	}[];
	return data;
}
