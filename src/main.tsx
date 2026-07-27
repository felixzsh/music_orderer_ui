

import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "./App.tsx";
import "./index.css";
import { PendingRequestsProvider } from "./components/PendingRequestsProvider";

createRoot(document.getElementById("root")!).render(
  <PendingRequestsProvider>
    <Toaster position="bottom-right" richColors />
    <App />
  </PendingRequestsProvider>
);
  