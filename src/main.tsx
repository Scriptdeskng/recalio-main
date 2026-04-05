import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { migrateLocalStorage } from "./lib/storage-migration";

migrateLocalStorage();

createRoot(document.getElementById("root")!).render(<App />);
