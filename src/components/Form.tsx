import { useAccount } from "jazz-react";

export function Form() {
	const { me } = useAccount({ profile: {}, root: {} });

	if (!me) return null;

	return (
		<div className="grid gap-4 border p-8">
			<div className="flex items-center gap-3">
				<label htmlFor="name" className="sm:w-32">
					Name
				</label>
				<input
					type="text"
					id="name"
					placeholder="Enter your name here..."
					className="border border-stone-300 rounded shadow-sm py-1 px-2 flex-1"
					value={me.profile.name || ""}
					onChange={(e) => (me.profile.name = e.target.value)}
				/>
			</div>
		</div>
	);
}
