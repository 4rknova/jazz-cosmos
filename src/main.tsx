import { JazzProvider } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { apiKey } from "./apiKey.ts";
import { CosmosAccount } from "./schema.ts";

// We use this to identify the app in the passkey auth
export const APPLICATION_NAME = "Jazz starter";

declare module "jazz-react" {
	export interface Register {
		Account: CosmosAccount;
	}
}

// biome-ignore lint/style/noNonNullAssertion: <explanation>
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<JazzProvider
			sync={{
				peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
				when: "signedUp", // This way when the user hasn't signed up we store the data only locally
			}}
			AccountSchema={CosmosAccount}
		>
			<App />
		</JazzProvider>
	</StrictMode>,
);
