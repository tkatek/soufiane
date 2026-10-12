const projectDetails = new Map([
  ["powergym", { name: "PowerGym", number: "01" }],
  ["marrakesh-beauty", { name: "Marrakesh Beauty", number: "02" }],
  ["invoiceflow", { name: "InvoiceFlow", number: "03" }],
  ["riadsoq", { name: "Riadsoq", number: "04" }],
  ["remtoo", { name: "Remtoo", number: "05" }],
  ["boston-english-center", { name: "Boston English Center", number: "06" }],
  ["blossom-word-bloom", { name: "Blossom / Word Bloom", number: "07" }],
  ["english-grammar-game", { name: "English Grammar Game", number: "08" }],
  ["cursor-agency-concept", { name: "Cursor", number: "09" }],
  ["tourism-amanar", { name: "Tourism Amanar", number: "10" }],
  ["django-projects", { name: "Django Projects", number: "11" }],
  ["laravel-saas-experiments", { name: "Laravel SaaS Experiments", number: "12" }],
  ["n8n-automation-experiments", { name: "n8n Automation Experiments", number: "13" }],
  ["definite-dash-game", { name: "Definite Dash", number: "14" }],
  ["perfume-store", { name: "Perfume Store", number: "15" }],
  ["cap-store", { name: "Cap Store", number: "16" }],
  ["jewelry-store", { name: "Jewelry Store", number: "17" }],
]);

const project = projectDetails.get(new URLSearchParams(window.location.search).get("project"));
const title = document.querySelector("#project-title");
const message = document.querySelector("#project-message");
const number = document.querySelector("#project-number");
const invoiceFlowCaseStudy = document.querySelector("#invoiceflow-case-study");
const powerGymCaseStudy = document.querySelector("#powergym-case-study");

if (project && title && message && number) {
  title.textContent = project.name;
  number.textContent = `${project.number} / 17`;
  message.textContent = "The full project story, screenshots, and details will be added here soon.";
  if (new URLSearchParams(window.location.search).get("project") === "invoiceflow" && invoiceFlowCaseStudy) {
    message.textContent = "A Flutter mobile app for helping businesses and independent professionals manage invoices with a clearer digital workflow.";
    invoiceFlowCaseStudy.hidden = false;
  }
  if (new URLSearchParams(window.location.search).get("project") === "powergym" && powerGymCaseStudy) {
    message.textContent = "A centralized gym management platform for members, subscriptions, payments, coaches, operations, and business analytics.";
    powerGymCaseStudy.hidden = false;
  }
  document.title = `${project.name} | Soufiane`;
} else if (title && message) {
  title.textContent = "Project not found";
  message.textContent = "This project link is invalid or no longer available. Return to the portfolio to browse the project list.";
  document.title = "Project Not Found | Soufiane";
}
