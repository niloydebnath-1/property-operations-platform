export const resources=[
 {key:"properties",label:"Properties",singular:"Property",roles:["SUPER_ADMIN","COMPANY_ADMIN","PROPERTY_MANAGER","PROPERTY_OWNER"],fields:["address","type","owner","manager","status"]},
 {key:"units",label:"Units",singular:"Unit",roles:["SUPER_ADMIN","COMPANY_ADMIN","PROPERTY_MANAGER"],fields:["property","unitNumber","floor","type","status"]},
 {key:"clients",label:"Clients & Tenants",singular:"Client",roles:["SUPER_ADMIN","COMPANY_ADMIN","PROPERTY_MANAGER","CALL_AGENT"],fields:["email","phone","clientType","status"]},
 {key:"work-orders",label:"Work Orders",singular:"Work Order",roles:["SUPER_ADMIN","COMPANY_ADMIN","PROPERTY_MANAGER","MAINTENANCE_MANAGER","TECHNICIAN","VENDOR","CALL_AGENT"],fields:["property","priority","assignee","dueDate","status"]},
 {key:"maintenance",label:"Maintenance",singular:"Maintenance Task",roles:["SUPER_ADMIN","COMPANY_ADMIN","PROPERTY_MANAGER","MAINTENANCE_MANAGER","TECHNICIAN"],fields:["property","asset","scheduleDate","frequency","status"]},
 {key:"vendors",label:"Vendors",singular:"Vendor",roles:["SUPER_ADMIN","COMPANY_ADMIN","PROPERTY_MANAGER","MAINTENANCE_MANAGER"],fields:["email","phone","category","serviceArea","status"]},
 {key:"emails",label:"Email Center",singular:"Email",roles:["SUPER_ADMIN","COMPANY_ADMIN","PROPERTY_MANAGER","CALL_AGENT"],fields:["from","to","subject","relatedRecord","status"]},
 {key:"calls",label:"Call Center",singular:"Call",roles:["SUPER_ADMIN","COMPANY_ADMIN","CALL_AGENT","CUSTOMER_SUPPORT"],fields:["caller","phone","direction","agent","outcome"]},
 {key:"calendar",label:"Calendar & Scheduling",singular:"Event",roles:["SUPER_ADMIN","COMPANY_ADMIN","PROPERTY_MANAGER","MAINTENANCE_MANAGER","TECHNICIAN"],fields:["startAt","endAt","assignee","relatedRecord"]},
 {key:"invoices",label:"Invoices & Payments",singular:"Invoice",roles:["SUPER_ADMIN","COMPANY_ADMIN","ACCOUNTANT"],fields:["client","amount","dueDate","paymentStatus"]},
 {key:"documents",label:"Documents",singular:"Document",roles:["SUPER_ADMIN","COMPANY_ADMIN","PROPERTY_MANAGER","ACCOUNTANT"],fields:["category","fileName","relatedRecord","expiryDate"]},
 {key:"notifications",label:"Notifications",singular:"Notification",roles:["SUPER_ADMIN","COMPANY_ADMIN"],fields:["recipient","channel","message","status"]},
 {key:"reports",label:"Reports",singular:"Report",roles:["SUPER_ADMIN","COMPANY_ADMIN","ACCOUNTANT","PROPERTY_MANAGER"],fields:["reportType","period","generatedBy"]},
 {key:"employees",label:"Employees & Teams",singular:"Employee",roles:["SUPER_ADMIN","COMPANY_ADMIN"],fields:["email","department","role","status"]},
 {key:"inspections",label:"Inspections",singular:"Inspection",roles:["SUPER_ADMIN","COMPANY_ADMIN","PROPERTY_MANAGER","MAINTENANCE_MANAGER"],fields:["property","inspector","scheduledAt","result"]},
 {key:"leases",label:"Leases & Agreements",singular:"Lease",roles:["SUPER_ADMIN","COMPANY_ADMIN","PROPERTY_MANAGER"],fields:["tenant","unit","startDate","endDate","status"]},
 {key:"settings",label:"Settings",singular:"Setting",roles:["SUPER_ADMIN","COMPANY_ADMIN"],fields:["key","value","description"]}
] as const;
export type ResourceKey=typeof resources[number]["key"];
export function getResource(key:string){return resources.find(r=>r.key===key)}
