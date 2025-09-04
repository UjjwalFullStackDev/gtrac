import type { GpsFuel } from '../types/fuelTypes';

const DIFFERENCE_THRESHOLD_PCT = 5;

export const fuelUtils = {
  formatDateTime(dt?: string): string {
    if (!dt) return "-";
    try {
      const d = new Date(dt);
      return d.toLocaleString();
    } catch {
      return dt;
    }
  },

  calculateDifferencePct(software: number, app: number): number {
    if (!isFinite(software) || software <= 0) return 0;
    const diff = Math.abs(software - app);
    return +(diff / software * 100).toFixed(2);
  },

  statusFromDiff(pct: number): 'OK' | 'Audit' {
    return pct > DIFFERENCE_THRESHOLD_PCT ? "Audit" : "OK";
  },

  pickLatestFilling(points: GpsFuel[]): GpsFuel | undefined {
    return [...points]
      .filter(p => (p.filling && p.filling > 0) || /filling/i.test(p.fueltype || ""))
      .sort((a, b) => new Date(b.gps_time).getTime() - new Date(a.gps_time).getTime())[0];
  }
};