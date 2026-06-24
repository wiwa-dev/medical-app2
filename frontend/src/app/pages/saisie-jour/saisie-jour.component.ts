import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FinanceService,
  DailyServiceValue,
  DayHistoryRow,
  MedicalService,
  toDateStr,
} from '../../core/services/finance.service';
import { ToastService } from '../../core/services/toast.service';

interface ExpenseRow {
  description: string;
  amount: number;
}

@Component({
  selector: 'app-saisie-jour',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="flex flex-col min-h-screen bg-background pb-24">

  <!-- Sticky Top App Bar -->
  <header class="sticky top-0 z-10 w-full bg-surface border-b border-outline-variant">
    <div class="flex justify-between items-center px-container-padding h-16">
      <button (click)="prevDay()" aria-label="Jour précédent"
              class="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
        <span class="material-symbols-outlined">chevron_left</span>
      </button>
      <h2 class="font-headline-md text-headline-md text-on-surface font-bold min-w-[200px] text-center capitalize">
        {{ selectedDateLabel }}
      </h2>
      <button (click)="nextDay()" aria-label="Jour suivant"
              class="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
        <span class="material-symbols-outlined">chevron_right</span>
      </button>
      <div class="hidden md:flex items-center gap-3 ml-4">
        <input type="date" [(ngModel)]="selectedDate" (change)="onDateChange()"
               class="text-body-md border border-outline-variant rounded-lg px-3 py-1.5 text-on-surface bg-surface-container-lowest focus:border-primary focus:outline-none" />
      </div>
    </div>
  </header>

  <!-- Canvas -->
  <div class="p-4 md:p-container-padding space-y-6 flex-1">

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">

      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
        <div class="flex items-center gap-2 text-on-surface-variant">
          <span class="material-symbols-outlined text-primary" style="font-size: 20px;">payments</span>
          <span class="font-label-caps text-label-caps uppercase text-secondary">Recettes (Jour)</span>
        </div>
        <div class="font-headline-sm text-headline-sm text-on-surface">{{ totalReceipts | number:'1.0-0' }} FCFA</div>
      </div>

      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
        <div class="flex items-center gap-2 text-on-surface-variant">
          <span class="material-symbols-outlined text-error" style="font-size: 20px;">money_off</span>
          <span class="font-label-caps text-label-caps uppercase text-secondary">Dépenses (Jour)</span>
        </div>
        <div class="font-headline-sm text-headline-sm text-on-surface">{{ totalExpenses | number:'1.0-0' }} FCFA</div>
      </div>

      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
        <div class="absolute right-0 top-0 w-16 h-16 bg-primary/5 rounded-bl-full"></div>
        <div class="flex items-center gap-2 text-on-surface-variant">
          <span class="material-symbols-outlined text-primary-container" style="font-size: 20px;">account_balance</span>
          <span class="font-label-caps text-label-caps uppercase text-secondary">Solde Net (Semaine)</span>
        </div>
        <div class="font-headline-sm text-headline-sm"
             [class.text-primary]="weeklyReceipts - weeklyExpenses >= 0"
             [class.text-error]="weeklyReceipts - weeklyExpenses < 0">
          {{ weeklyReceipts - weeklyExpenses | number:'1.0-0' }} FCFA
        </div>
      </div>

      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
        <div class="flex items-center gap-2 text-on-surface-variant">
          <span class="material-symbols-outlined text-tertiary" style="font-size: 20px;">calendar_today</span>
          <span class="font-label-caps text-label-caps uppercase text-secondary">Recettes (Semaine)</span>
        </div>
        <div class="font-headline-sm text-headline-sm text-on-surface">{{ weeklyReceipts | number:'1.0-0' }} FCFA</div>
      </div>

    </div>

    <!-- Service Entry Table -->
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-sm">
      <div class="bg-surface border-b border-outline-variant px-4 py-3 flex justify-between items-center">
        <h3 class="font-headline-sm text-headline-sm text-on-surface">Recettes par Service</h3>
        <span class="font-label-caps text-label-caps uppercase text-secondary">Montants en FCFA</span>
      </div>

      @if (servicesLoading) {
        <div class="flex items-center justify-center py-10 gap-2 text-on-surface-variant">
          <span class="material-symbols-outlined animate-spin" style="font-size:20px">progress_activity</span>
          <span class="text-sm">Chargement des services…</span>
        </div>
      } @else {
        <div class="table-scroll overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant">
                <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3 sticky left-0 bg-surface-container-low w-28">Date</th>
                @for (svc of services; track svc.Name) {
                  <th class="font-label-caps text-label-caps text-secondary uppercase px-2 py-3 text-right min-w-[80px]">{{ svc.ShortLabel }}</th>
                }
                <th class="font-label-caps text-label-caps text-error uppercase px-2 py-3 text-right bg-error-container/10 border-l border-outline-variant/50 min-w-[90px]">Dépenses</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/50">
              <tr class="group">
                <td class="font-body-md text-body-md px-4 py-2 sticky left-0 bg-primary/5 font-medium text-primary whitespace-nowrap">
                  {{ formatDate(selectedDate) }}
                </td>
                @for (svc of services; track svc.Name) {
                  <td class="px-2 py-1">
                    <input [(ngModel)]="entry[svc.Name]"
                           type="number" min="0"
                           class="med-input font-data-tabular text-data-tabular"
                           placeholder="0" />
                  </td>
                }
                <td class="px-2 py-1 bg-error-container/5 border-l border-outline-variant/50">
                  <span class="font-data-tabular text-data-tabular text-error block text-right px-2">
                    {{ totalExpenses | number:'1.0-0' }}
                  </span>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="bg-surface-container-low border-t-2 border-outline-variant">
                <td class="font-label-caps text-label-caps text-on-surface uppercase px-4 py-3 sticky left-0 bg-surface-container-low font-bold">Sous-total</td>
                @for (svc of services; track svc.Name) {
                  <td class="font-data-tabular text-data-tabular px-4 py-3 text-right font-bold text-on-surface">{{ entry[svc.Name] || 0 }}</td>
                }
                <td class="font-data-tabular text-data-tabular px-4 py-3 text-right font-bold text-error bg-error-container/10 border-l border-outline-variant/50">
                  {{ totalExpenses | number:'1.0-0' }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="bg-surface px-4 py-3 border-t border-outline-variant flex justify-between items-center">
          <span class="font-label-caps text-label-caps text-on-surface-variant">Total Recettes du jour</span>
          <span class="font-data-tabular text-data-tabular font-bold text-lg text-primary">{{ totalReceipts | number:'1.0-0' }} FCFA</span>
        </div>
      }
    </div>

    <!-- Dépenses journalières -->
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div class="bg-error-container/20 px-4 py-3 border-b border-outline-variant flex items-center gap-2">
        <span class="material-symbols-outlined text-error">remove_circle</span>
        <h3 class="font-headline-sm text-headline-sm text-error">Dépenses journalières</h3>
      </div>
      <div class="p-4 flex flex-col gap-3">
        @for (exp of expenses; track $index) {
          <div class="flex gap-2 items-center">
            <input type="text" [(ngModel)]="exp.description" placeholder="Description..."
                   class="flex-1 border border-outline-variant rounded-lg px-3 py-2 font-body-md text-body-md text-on-surface bg-transparent hover:bg-surface-container focus:bg-surface-container-lowest focus:border-primary focus:outline-none transition-all" />
            <input type="number" min="0" [(ngModel)]="exp.amount" placeholder="0"
                   class="med-input w-32 font-data-tabular text-data-tabular border border-outline-variant rounded-lg" />
            <button type="button" (click)="openDechargeModal($index)"
                    class="p-2 text-tertiary hover:bg-tertiary-container/20 rounded-lg transition-colors"
                    title="Generer une decharge">
              <span class="material-symbols-outlined" style="font-size: 18px;">description</span>
            </button>
            @if (expenses.length > 1) {
              <button type="button" (click)="removeExpense($index)"
                      class="p-2 text-on-surface-variant hover:text-error transition-colors rounded-lg hover:bg-error-container/20">
                <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
              </button>
            }
          </div>
        }
        <button type="button" (click)="addExpense()"
                class="text-error font-body-md font-medium flex items-center gap-1 hover:bg-error-container/30 w-fit px-3 py-2 rounded-lg transition-colors">
          <span class="material-symbols-outlined" style="font-size: 16px;">add</span> Ajouter une ligne
        </button>
      </div>
      <div class="bg-surface px-4 py-3 border-t border-outline-variant flex justify-between items-center">
        <span class="font-label-caps text-label-caps text-on-surface-variant">Sous-total Dépenses</span>
        <span class="font-data-tabular text-data-tabular font-bold text-lg text-error">{{ totalExpenses | number:'1.0-0' }} FCFA</span>
      </div>
    </div>

    <!-- Historique semaine -->
    <div class="space-y-3">
      <h3 class="font-headline-sm text-headline-sm text-on-surface">Historique de la semaine</h3>
      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div class="table-scroll overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant">
                <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3 sticky left-0 bg-surface-container-low z-10 w-32">Date</th>
                <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3">Statut</th>
                <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3 text-right">Recettes (FCFA)</th>
                <th class="font-label-caps text-label-caps text-error uppercase px-4 py-3 text-right bg-error-container/10 border-l border-outline-variant/50">Dépenses (FCFA)</th>
                <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3 text-right">Solde Net</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/50">
              @for (row of weekHistory; track row.Date) {
                <tr class="hover:bg-surface-container-lowest transition-colors"
                    [class.bg-primary-container]="row.Date === selectedDate"
                    [class.bg-opacity-5]="row.Date === selectedDate">
                  <td class="font-body-md text-body-md px-4 py-2 sticky left-0 bg-surface-container-lowest font-medium whitespace-nowrap">
                    {{ formatDate(row.Date) }}
                  </td>
                  <td class="px-4 py-2">
                    @if (row.Status === 'validated') {
                      <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-container/20 text-primary text-[10px] font-bold uppercase tracking-wider">
                        <span class="material-symbols-outlined" style="font-size: 12px;">check_circle</span> Validé
                      </span>
                    } @else {
                      <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface-variant text-on-surface-variant text-[10px] font-bold uppercase tracking-wider">
                        <span class="material-symbols-outlined" style="font-size: 12px;">hourglass_empty</span> Brouillon
                      </span>
                    }
                  </td>
                  <td class="font-data-tabular text-data-tabular px-4 py-3 text-right font-bold text-on-surface">{{ row.TotalReceipts | number:'1.0-0' }}</td>
                  <td class="font-data-tabular text-data-tabular px-4 py-3 text-right font-bold text-error bg-error-container/5 border-l border-outline-variant/50">{{ row.TotalExpenses | number:'1.0-0' }}</td>
                  <td class="font-data-tabular text-data-tabular px-4 py-3 text-right font-bold"
                      [class.text-primary]="row.NetBalance >= 0"
                      [class.text-error]="row.NetBalance < 0">
                    {{ row.NetBalance | number:'1.0-0' }}
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="p-8 text-center text-on-surface-variant font-body-md">Aucune saisie cette semaine.</td>
                </tr>
              }
            </tbody>
            @if (weekHistory.length > 0) {
              <tfoot>
                <tr class="bg-surface-container-low border-t-2 border-outline-variant">
                  <td class="font-label-caps text-label-caps text-on-surface uppercase px-4 py-3 sticky left-0 bg-surface-container-low z-10 font-bold" colspan="2">TOTAUX (SEMAINE)</td>
                  <td class="font-data-tabular text-data-tabular px-4 py-3 text-right font-bold text-primary">{{ weeklyReceipts | number:'1.0-0' }}</td>
                  <td class="font-data-tabular text-data-tabular px-4 py-3 text-right font-bold text-error bg-error-container/10 border-l border-outline-variant/50">{{ weeklyExpenses | number:'1.0-0' }}</td>
                  <td class="font-data-tabular text-data-tabular px-4 py-3 text-right font-bold text-primary">{{ weeklyReceipts - weeklyExpenses | number:'1.0-0' }}</td>
                </tr>
              </tfoot>
            }
          </table>
        </div>
      </div>
    </div>

  </div>

  <!-- Fixed Bottom Action Bar -->
  <div class="fixed bottom-0 left-0 md:left-[260px] right-0 bg-surface border-t border-outline-variant p-4 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] no-print">
    <div class="max-w-screen-xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
      <div class="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
        <span class="material-symbols-outlined" style="font-size: 18px;">info</span>
        Saisie journalière — {{ todayLabel }}
      </div>
      <div class="flex gap-3 w-full sm:w-auto">
        <button type="button" (click)="exportPDF()"
                class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-tertiary bg-tertiary-container/20 text-tertiary rounded-lg font-label-caps text-label-caps uppercase hover:bg-tertiary-container/40 transition-colors">
          <span class="material-symbols-outlined" style="font-size: 18px;">picture_as_pdf</span>
          PDF
        </button>
        <button type="button" (click)="cancel()"
                class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-outline bg-surface-container-lowest text-on-surface rounded-lg font-label-caps text-label-caps uppercase hover:bg-surface-container-low transition-colors">
          <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
          Annuler
        </button>
        <button type="button" (click)="save()" [disabled]="saving"
                class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps uppercase hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60">
          <span class="material-symbols-outlined" style="font-size: 18px;">save</span>
          {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </div>
    </div>
  </div>

  <!-- ── Decharge Modal ── -->
  @if (dechargeTarget !== null) {
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="closeDechargeModal()">
      <div class="bg-surface rounded-xl shadow-xl max-w-md w-full mx-4 p-6" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-tertiary" style="font-size: 20px;">description</span>
            Generer une decharge
          </h3>
          <button (click)="closeDechargeModal()" class="p-2 text-on-surface-variant hover:text-error rounded-lg transition-colors">
            <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
          </button>
        </div>
        <!-- Form -->
        <div class="space-y-4">
          <div>
            <label class="font-label-caps text-label-caps text-on-surface-variant block mb-1">Motif</label>
            <input type="text" [value]="dechargeDescription" readonly
                   class="w-full border border-outline-variant rounded-lg px-3 py-2 font-body-md bg-surface-container-low text-on-surface-variant cursor-not-allowed" />
          </div>
          <div>
            <label class="font-label-caps text-label-caps text-on-surface-variant block mb-1">Montant (FCFA)</label>
            <input type="number" [value]="dechargeAmount" readonly
                   class="w-full border border-outline-variant rounded-lg px-3 py-2 font-data-tabular bg-surface-container-low text-on-surface-variant cursor-not-allowed" />
          </div>
          <div>
            <label class="font-label-caps text-label-caps text-on-surface-variant block mb-1">
              Nom du beneficiaire <span class="text-error">*</span>
            </label>
            <input type="text" [(ngModel)]="dechargeBeneficiary" placeholder="Ex: Seydina Issa FAYE"
                   class="w-full border border-outline-variant rounded-lg px-3 py-2 font-body-md bg-surface-container-lowest focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label class="font-label-caps text-label-caps text-on-surface-variant block mb-1">
              N CIN / Piece d identite <span class="text-error">*</span>
            </label>
            <input type="text" [(ngModel)]="dechargeCin" placeholder="Ex: 1758199600047"
                   class="w-full border border-outline-variant rounded-lg px-3 py-2 font-body-md bg-surface-container-lowest focus:border-primary focus:outline-none" />
          </div>
        </div>
        <!-- Actions -->
        <div class="flex justify-end gap-3 mt-6">
          <button (click)="closeDechargeModal()"
                  class="px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-label-caps text-label-caps uppercase hover:bg-surface-container-low transition-colors">
            Annuler
          </button>
          <button (click)="generateDecharge()" [disabled]="dechargeGenerating"
                  class="px-4 py-2 bg-tertiary text-on-tertiary rounded-lg font-label-caps text-label-caps uppercase hover:bg-tertiary/90 transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2">
            @if (dechargeGenerating) {
              <span class="material-symbols-outlined animate-spin" style="font-size: 16px;">progress_activity</span>
            }
            {{ dechargeGenerating ? 'Generation...' : 'Generer le PDF' }}
          </button>
        </div>
      </div>
    </div>
  }

</div>
  `,
})
export class SaisieJourComponent implements OnInit {
  private financeService = inject(FinanceService);
  private toast = inject(ToastService);

  // Decharge modal state
  dechargeTarget: number | null = null;
  dechargeDescription = '';
  dechargeAmount = 0;
  dechargeBeneficiary = '';
  dechargeCin = '';
  dechargeGenerating = false;

  todayLabel = '';
  selectedDate = toDateStr(new Date());
  saving = false;
  servicesLoading = true;

  /** Catalogue of services loaded from DB */
  services: MedicalService[] = [];

  /** Current day amounts: { serviceName → amount } */
  entry: Record<string, number> = {};

  expenses: ExpenseRow[] = [{ description: '', amount: 0 }];
  weekHistory: DayHistoryRow[] = [];

  get selectedDateLabel(): string {
    if (!this.selectedDate) return '';
    const d = new Date(this.selectedDate + 'T00:00:00');
    const s = d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  get totalReceipts(): number {
    return Object.values(this.entry).reduce((s, v) => s + (v || 0), 0);
  }

  get totalExpenses(): number {
    return this.expenses.reduce((s, e) => s + (e.amount || 0), 0);
  }

  get weeklyReceipts(): number {
    return this.weekHistory.reduce((s, r) => s + r.TotalReceipts, 0);
  }

  get weeklyExpenses(): number {
    return this.weekHistory.reduce((s, r) => s + r.TotalExpenses, 0);
  }

  ngOnInit(): void {
    this.setTodayLabel();
    this.loadServices();
  }

  setTodayLabel(): void {
    const opts: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const s = new Date().toLocaleDateString('fr-FR', opts);
    this.todayLabel = s.charAt(0).toUpperCase() + s.slice(1);
  }

  async loadServices(): Promise<void> {
    try {
      this.services = await this.financeService.getServices();
      // Initialise entry map with 0 for every service
      this.entry = {};
      for (const svc of this.services) {
        this.entry[svc.Name] = 0;
      }
    } catch (err) {
      this.toast.error('Erreur chargement des services: ' + err);
    } finally {
      this.servicesLoading = false;
    }
    // Load data for current date after services are ready
    await this.loadData();
  }

  prevDay(): void {
    const d = new Date(this.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    this.selectedDate = toDateStr(d);
    this.loadData();
  }

  nextDay(): void {
    const d = new Date(this.selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    this.selectedDate = toDateStr(d);
    this.loadData();
  }

  onDateChange(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      const [entryData, history] = await Promise.all([
        this.financeService.getDailyEntry(this.selectedDate),
        this.financeService.getWeekHistory(this.selectedDate),
      ]);

      // Reset all service values to 0, then fill from DB
      const newEntry: Record<string, number> = {};
      for (const svc of this.services) {
        newEntry[svc.Name] = 0;
      }
      for (const sv of entryData.ServiceValues ?? []) {
        newEntry[sv.ServiceName] = sv.Amount;
      }
      this.entry = newEntry;

      if (entryData.Expenses && entryData.Expenses.length > 0) {
        this.expenses = entryData.Expenses.map(ex => ({ description: ex.Description, amount: ex.Amount }));
      } else {
        this.expenses = [{ description: '', amount: 0 }];
      }

      this.weekHistory = history || [];
    } catch (err) {
      this.toast.error('Erreur lors du chargement: ' + err);
    }
  }

  addExpense(): void {
    this.expenses.push({ description: '', amount: 0 });
  }

  removeExpense(index: number): void {
    this.expenses.splice(index, 1);
  }

  cancel(): void {
    this.loadData();
  }

  async save(): Promise<void> {
    this.saving = true;
    try {
      // Build service values array from entry map
      const serviceValues: DailyServiceValue[] = this.services
        .filter(svc => (this.entry[svc.Name] || 0) > 0)
        .map(svc => ({ Date: this.selectedDate, ServiceName: svc.Name, Amount: this.entry[svc.Name] || 0 } as DailyServiceValue));

      const expPayload = this.expenses
        .filter(e => e.amount > 0 || e.description.trim())
        .map(e => ({ Date: this.selectedDate, Description: e.description, Amount: e.amount || 0 } as any));

      await this.financeService.saveDailyEntry(this.selectedDate, serviceValues, expPayload);
      this.toast.success('Saisie enregistrée avec succès');
      await this.loadData();
    } catch (err) {
      this.toast.error('Erreur lors de l\'enregistrement: ' + err);
    } finally {
      this.saving = false;
    }
  }

  async exportPDF(): Promise<void> {
    try {
      const filePath = await this.financeService.exportDailyPDF(this.selectedDate);
      this.toast.success('PDF généré avec succès');
      await this.financeService.openDoc(filePath);
    } catch (err) {
      this.toast.error('Erreur lors de la génération du PDF: ' + err);
    }
  }

  // ── Decharge Modal ─────────────────────────────────────────
  openDechargeModal(index: number): void {
    const exp = this.expenses[index];
    this.dechargeTarget = index;
    this.dechargeDescription = exp.description;
    this.dechargeAmount = exp.amount;
    this.dechargeBeneficiary = '';
    this.dechargeCin = '';
  }

  closeDechargeModal(): void {
    this.dechargeTarget = null;
    this.dechargeDescription = '';
    this.dechargeAmount = 0;
    this.dechargeBeneficiary = '';
    this.dechargeCin = '';
    this.dechargeGenerating = false;
  }

  async generateDecharge(): Promise<void> {
    if (!this.dechargeBeneficiary.trim()) {
      this.toast.error('Veuillez saisir le nom du beneficiaire');
      return;
    }
    if (!this.dechargeCin.trim()) {
      this.toast.error('Veuillez saisir le numero CIN');
      return;
    }
    if (this.dechargeAmount <= 0) {
      this.toast.error('Le montant doit etre superieur a 0');
      return;
    }
    this.dechargeGenerating = true;
    try {
      const filePath = await this.financeService.generateDecharge(
        this.selectedDate,
        this.dechargeDescription,
        this.dechargeAmount,
        this.dechargeBeneficiary.trim(),
        this.dechargeCin.trim(),
      );
      this.toast.success('Decharge generee avec succes');
      this.closeDechargeModal();
      await this.financeService.openDoc(filePath);
    } catch (err) {
      this.toast.error('Erreur lors de la generation: ' + err);
    } finally {
      this.dechargeGenerating = false;
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
