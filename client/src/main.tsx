import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Include inter font from Google Fonts
const linkEl = document.createElement("link");
linkEl.rel = "stylesheet";
linkEl.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
document.head.appendChild(linkEl);

// Add title
const titleEl = document.createElement("title");
titleEl.textContent = "OrganizationPro - Hierarchical Management System";
document.head.appendChild(titleEl);

// Add favicon
const faviconEl = document.createElement("link");
faviconEl.rel = "icon";
faviconEl.type = "image/svg+xml";
faviconEl.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%232563eb'%3E%3Cpath d='M12 6a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm-1.5 8a4 4 0 00-4 4v.5h11v-.5a4 4 0 00-4-4h-3zm7-8a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm3.5 7h-2.25a5.5 5.5 0 01.25 1.5v.5h4v-.5a2.5 2.5 0 00-2-2.5zM5 6a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-2 7a2.5 2.5 0 00-2 2.5v.5h4v-.5c0-.53.084-1.046.25-1.5H3z'/%3E%3C/svg%3E";
document.head.appendChild(faviconEl);

// Font Awesome
const faScriptEl = document.createElement("script");
faScriptEl.src = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/js/all.min.js";
faScriptEl.defer = true;
document.head.appendChild(faScriptEl);

createRoot(document.getElementById("root")!).render(<App />);
