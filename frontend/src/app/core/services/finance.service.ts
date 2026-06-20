import { Injectable } from '@angular/core';
import {
  GetDailyEntry,
  SaveDailyEntry,
  GetWeekHistory,
  GetMonthlyReport,
  GetMonthlyHonoraires,
  SaveMonthlyHonoraires,
  GetInvestments,
  SaveInvestments,
  GetAnnualReport,
  ExportAnnualExcel,
  GetYearSettings,
  SetInitialBalance,
  OpenDoc,
} from '../../../../wailsjs/go/main/App';
import { models } from '../../../../wailsjs/go/models';

export type DailyEntry = models.DailyEntry;
export type DailyExpense = models.DailyExpense;
export type MonthlyHonoraire = models.MonthlyHonoraire;
export type Investment = models.Investment;
export type DayHistoryRow = models.DayHistoryRow;
export type MonthlyReport = models.MonthlyReport;
export type AnnualReport = models.AnnualReport;
export type YearSettings = models.YearSettings;
export type DailyEntryWithExpenses = models.DailyEntryWithExpenses;

/** Returns "YYYY-MM-DD" for any Date object. */
export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns "YYYY-MM-DD" of the Monday of the week containing d. */
export function mondayOf(d: Date): string {
  const day = d.getDay(); // 0=Sun, 1=Mon…
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return toDateStr(monday);
}

@Injectable({ providedIn: 'root' })
export class FinanceService {
  getDailyEntry(date: string): Promise<DailyEntryWithExpenses> {
    return GetDailyEntry(date);
  }

  saveDailyEntry(date: string, entry: DailyEntry, expenses: DailyExpense[]): Promise<void> {
    return SaveDailyEntry(date, entry, expenses);
  }

  getWeekHistory(date: string): Promise<DayHistoryRow[]> {
    return GetWeekHistory(date);
  }

  getMonthlyReport(month: number, year: number): Promise<MonthlyReport> {
    return GetMonthlyReport(month, year);
  }

  getMonthlyHonoraires(month: number, year: number): Promise<MonthlyHonoraire[]> {
    return GetMonthlyHonoraires(month, year);
  }

  saveMonthlyHonoraires(month: number, year: number, honoraires: MonthlyHonoraire[]): Promise<void> {
    return SaveMonthlyHonoraires(month, year, honoraires);
  }

  getInvestments(month: number, year: number): Promise<Investment[]> {
    return GetInvestments(month, year);
  }

  saveInvestments(month: number, year: number, investments: Investment[]): Promise<void> {
    return SaveInvestments(month, year, investments);
  }

  getAnnualReport(year: number): Promise<AnnualReport> {
    return GetAnnualReport(year);
  }

  exportAnnualExcel(year: number): Promise<string> {
    return ExportAnnualExcel(year);
  }

  getYearSettings(year: number): Promise<YearSettings> {
    return GetYearSettings(year);
  }

  setInitialBalance(year: number, amount: number): Promise<void> {
    return SetInitialBalance(year, amount);
  }

  openDoc(filePath: string): Promise<void> {
    return OpenDoc(filePath);
  }
}
