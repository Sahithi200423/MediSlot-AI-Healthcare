export interface HealthStatus {
  status: "ok" | "degraded" | "down"
  service: string
  version: string
  uptime: number
  timestamp: string
  environment: string
  system: {
    nodeVersion: string
    memoryUsageMB: number
  }
}

export class HealthService {
  public static getSystemHealth(): HealthStatus {
    const memory = process.memoryUsage()
    return {
      status: "ok",
      service: "medislot-backend-api",
      version: "1.0.0",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      system: {
        nodeVersion: process.version,
        memoryUsageMB: Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100,
      },
    }
  }
}
