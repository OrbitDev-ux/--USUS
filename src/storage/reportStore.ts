import type { Report, ReportData } from '../types';
import { isRecord } from '../utils/guards';
import { JsonStore } from './jsonStore';
import { dataFile } from './paths';

function isReportData(value: unknown): value is ReportData {
  return isRecord(value) && typeof value.counter === 'number' && Array.isArray(value.reports);
}

const store = new JsonStore<ReportData>(dataFile('reports.json'), () => ({ counter: 0, reports: [] }), isReportData);

export async function reserveReportId(): Promise<number> {
  return store.update((data) => {
    data.counter += 1;
    return data.counter;
  });
}

export async function addReport(report: Report): Promise<void> {
  await store.update((data) => {
    data.reports.push(report);
  });
}

export async function getReports(guildId: string): Promise<readonly Report[]> {
  const data = await store.read();
  return data.reports.filter((r) => r.guildId === guildId);
}

export async function updateReportStatus(
  guildId: string,
  reportId: number,
  status: Report['status'],
  handledBy: string,
): Promise<Report | null> {
  return store.update((data) => {
    const report = data.reports.find((r) => r.guildId === guildId && r.id === reportId);
    if (report === undefined) {
      return null;
    }
    report.status = status;
    report.handledBy = handledBy;
    return report;
  });
}
