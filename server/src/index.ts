import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { env } from "./config/env";
import auth from "./modules/auth/auth.routes";
import dashboard from "./modules/dashboard/dashboard.routes";
import properties from "./modules/properties/properties.routes";
import units from "./modules/units/units.routes";
import contacts from "./modules/contacts/contacts.routes";
import serviceRequests from "./modules/service-requests/service-requests.routes";
import workOrders from "./modules/work-orders/work-orders.routes";
import maintenance from "./modules/maintenance/maintenance.routes";
import vendors from "./modules/vendors/vendors.routes";
import communications from "./modules/communications/communications.routes";
import calendar from "./modules/calendar/calendar.routes";
import finance from "./modules/finance/finance.routes";
import documents from "./modules/documents/documents.routes";
import notifications from "./modules/notifications/notifications.routes";
import reports from "./modules/reports/reports.routes";
import people from "./modules/people/people.routes";
import settings from "./modules/settings/settings.routes";
import resources from "./modules/resources/resources.routes";
import webhooks from "./modules/integrations/webhooks.routes";
import integrations from "./modules/integrations/integrations.routes";
import { notFound, errorHandler } from "./middleware/errors";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));

// Static serving for uploaded document files
app.use("/api/documents/raw", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", service: "property-operations-api" })
);

// Integration webhooks (Stripe, Twilio, Inbound Email)
app.use("/api/webhooks", webhooks);
app.use("/api/integrations", integrations);

// Core domain routes
app.use("/api/auth", auth);
app.use("/api/dashboard", dashboard);
app.use("/api/properties", properties);
app.use("/api/units", units);
app.use("/api/contacts", contacts);
app.use("/api/service-requests", serviceRequests);
app.use("/api/work-orders", workOrders);
app.use("/api/maintenance", maintenance);
app.use("/api/vendors", vendors);
app.use("/api/communications", communications);
app.use("/api/calendar", calendar);
app.use("/api/finance", finance);
app.use("/api/documents", documents);
app.use("/api/notifications", notifications);
app.use("/api/reports", reports);
app.use("/api/people", people);
app.use("/api/settings", settings);
app.use("/api/resources", resources);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () =>
  console.log(`API listening on http://localhost:${env.port}`)
);
