"use client";

import { useAccount, usePasskeyAuth } from "jazz-react";
import { APPLICATION_NAME } from "../main.tsx";

export function AuthButton() {
	const { logOut } = useAccount();

	const auth = usePasskeyAuth({
		appName: APPLICATION_NAME,
	});

	function handleLogOut() {
		logOut();
		window.history.pushState({}, "", "/");
	}

	async function handleSignUp() {
		try {
			await auth.signUp("user");
		} catch (error) {
			console.error("Sign up failed:", error);
		}
	}

	async function handleLogIn() {
		try {
			await auth.logIn();
		} catch (error) {
			console.error("Log in failed:", error);
		}
	}

	if (auth.state === "signedIn") {
		return (
			<button
				type="button"
				className="bg-stone-100 py-1.5 px-3 text-sm rounded-md"
				onClick={handleLogOut}
			>
				Log out
			</button>
		);
	}

	return (
		<div className="flex gap-2">
			<button
				type="button"
				className="bg-stone-100 py-1.5 px-3 text-sm rounded-md"
				onClick={handleSignUp}
			>
				Sign up
			</button>
			<button
				type="button"
				onClick={handleLogIn}
				className="bg-stone-100 py-1.5 px-3 text-sm rounded-md"
			>
				Log in
			</button>
		</div>
	);
}
