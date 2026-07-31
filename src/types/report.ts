export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Report {
  id: number;
  guildId: string;
  reporterId: string;
  targetId: string;
  reason: string;
  status: ReportStatus;
  handledBy: string | null;
  createdAt: string;
}

export interface ReportData {
  counter: number;
  reports: Report[];
}
