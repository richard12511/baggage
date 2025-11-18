export function setupProcessErrorHandlers(): void {
  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    console.error("❌ Unhandled Promise Rejection:");
    console.error("   Reason:", reason);
    console.error("   Promise:", promise);
  });

  process.on("uncaughtException", (error: Error) => {
    console.error("❌ Uncaught Exception:");
    console.error("   Message:", error.message);
    console.error("   Stack:", error.stack);
    console.error("   Application state may be unstable. Exiting...");

    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on("SIGTERM", () => {
    console.log(
      "SIGTERM received in processErrorHandler, shutting down gracefully..."
    );
  });
}
