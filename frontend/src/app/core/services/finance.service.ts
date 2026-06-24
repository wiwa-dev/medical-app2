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
  GetMonthlyOffres,
  SaveMonthlyOffres,
  GetAnnualReport,
  ExportAnnualExcel,
  ExportDailyPDF,
  GetYearSettings,
  SetInitialBalance,
  OpenDoc,
  GetServices,
  CreateService,
  UpdateService,
  DeleteService,
  SelectFile,
  SaveAttachment,
  CreateSupplier,
  UpdateSupplier,
  DeleteSupplier,
  GetSuppliers,
  GetAllSuppliers,
  AddSupplierExpense,
  DeleteSupplierExpense,
  GetSupplierExpenses,
  GetSupplierBudgetSummary,
} from '../../../../wailsjs/go/main/App';
import { models } from '../../../../wailsjs/go/models';

export type DailyEntry = models.DailyEntry;
export type DailyExpense = models.DailyExpense;
export type DailyServiceValue = models.DailyServiceValue;
export type MedicalService = models.MedicalService;
export type MonthlyHonoraire = models.MonthlyHonoraire;
export type Investment = models.Investment;
export type MonthlyOffre = models.MonthlyOffre;
export type DayHistoryRow = models.DayHistoryRow;
export type MonthlyReport = models.MonthlyReport;
export type AnnualReport = models.AnnualReport;
export type YearSettings = models.YearSettings;
export type DailyEntryWithExpenses = models.DailyEntryWithExpenses;
export type Supplier = models.Supplier;
export type SupplierExpense = models.SupplierExpense;
export type SupplierBudgetSummary = models.SupplierBudgetSummary;

/** Returns "YYYY-MM-DD" for any Date object. */
export function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns "YYYY-MM-DD" of the Monday of the week containing d. */
export function mondayOf(d: Date): string {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return toDateStr(monday);
}

@Injectable({ providedIn: 'root' })
export class FinanceService {
  // ── Daily entries ──────────────────────────────────────────
  getDailyEntry(date: string): Promise<DailyEntryWithExpenses> {
    return GetDailyEntry(date);
  }

  saveDailyEntry(date: string, serviceValues: DailyServiceValue[], expenses: DailyExpense[]): Promise<void> {
    return SaveDailyEntry(date, serviceValues, expenses);
  }

  getWeekHistory(date: string): Promise<DayHistoryRow[]> {
    return GetWeekHistory(date);
  }

  // ── Services catalogue ─────────────────────────────────────
  getServices(): Promise<MedicalService[]> {
    return GetServices();
  }

  createService(service: MedicalService): Promise<MedicalService> {
    return CreateService(service);
  }

  updateService(service: MedicalService): Promise<MedicalService> {
    return UpdateService(service);
  }

  deleteService(id: number): Promise<void> {
    return DeleteService(id);
  }

  // ── Monthly report ─────────────────────────────────────────
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

  // ── File attachments ────────────────────────────────────────
  selectFile(title: string): Promise<string> {
    return SelectFile(title);
  }

  saveAttachment(sourcePath: string, fileName: string): Promise<string> {
    return SaveAttachment(sourcePath, fileName);
  }
  
  // ── Offres (informational) ─────────────────────────────────
  getMonthlyOffres(month: number, year: number): Promise<MonthlyOffre[]> {
  	return GetMonthlyOffres(month, year);
  }
 
  saveMonthlyOffres(month: number, year: number, offres: MonthlyOffre[]): Promise<void> {
  	return SaveMonthlyOffres(month, year, offres);
  }
 
  // ── Annual report ──────────────────────────────────────────
  getAnnualReport(year: number): Promise<AnnualReport> {
    return GetAnnualReport(year);
  }

  exportAnnualExcel(year: number): Promise<string> {
    return ExportAnnualExcel(year);
  }

  // ── Year settings ──────────────────────────────────────────
  getYearSettings(year: number): Promise<YearSettings> {
    return GetYearSettings(year);
  }

  setInitialBalance(year: number, amount: number): Promise<void> {
    return SetInitialBalance(year, amount);
  }

  openDoc(filePath: string): Promise<void> {
    return OpenDoc(filePath);
  }

  // ── Supplier Budget Tracking ──────────────────────────────
  createSupplier(name: string, budgetYear: number, amountEngaged: number): Promise<Supplier> {
    return CreateSupplier(name, budgetYear, amountEngaged);
  }

  updateSupplier(id: number, name: string, budgetYear: number, amountEngaged: number): Promise<Supplier> {
    return UpdateSupplier(id, name, budgetYear, amountEngaged);
  }

  deleteSupplier(id: number): Promise<void> {
    return DeleteSupplier(id);
  }

  getSuppliers(budgetYear: number): Promise<Supplier[]> {
    return GetSuppliers(budgetYear);
  }

  getAllSuppliers(): Promise<Supplier[]> {
    return GetAllSuppliers();
  }

  addSupplierExpense(supplierID: number, amount: number, description: string, date: string): Promise<SupplierExpense> {
    return AddSupplierExpense(supplierID, amount, description, date);
  }

  deleteSupplierExpense(id: number): Promise<void> {
    return DeleteSupplierExpense(id);
  }

  getSupplierExpenses(supplierID: number): Promise<SupplierExpense[]> {
    return GetSupplierExpenses(supplierID);
  }

  getSupplierBudgetSummary(year: number): Promise<SupplierBudgetSummary[]> {
    return GetSupplierBudgetSummary(year);
  }

  // ── PDF Export ──────────────────────────────────────────────
  exportDailyPDF(date: string): Promise<string> {
    return ExportDailyPDF(date);
  }
}
