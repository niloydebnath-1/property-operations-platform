import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (err instanceof ZodError) {
    const readableMessages = err.issues.map((issue) => {
      const fieldPath = issue.path.join(".");
      const fieldName = fieldPath
        ? fieldPath.charAt(0).toUpperCase() + fieldPath.slice(1)
        : "Field";
      return `${fieldName}: ${issue.message}`;
    });

    return res.status(400).json({
      message: readableMessages.join(". ") || "Validation failed",
      errors: err.issues,
    });
  }

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
}
