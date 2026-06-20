import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, AnnualReport } from '../../core/services/finance.service';
import { ToastService } from '../../core/services/toast.service';

const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

@Component({
  selector: 'app-bilan-annuel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="flex flex-col min-h-screen bg-background pb-24">

  <!-- ── Sticky Header ── -->
  <header class="sticky top-0 z-10 w-full bg-surface border-b border-outline-variant no-print">
    <div class="flex flex-wrap justify-between items-center px-container-padding h-auto md:h-16 py-3 md:py-0 gap-3">

      <!-- Year navigation -->
      <div class="flex items-center gap-4">
        <button (click)="prevYear()" aria-label="Année précédente"
                class="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <h2 class="font-headline-md text-headline-md text-on-surface font-bold min-w-[100px] text-center">
          {{ selectedYear }}
        </h2>
        <button (click)="nextYear()" aria-label="Année suivante"
                class="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <!-- Controls -->
      <div class="flex flex-wrap items-center gap-3">
        <select [(ngModel)]="selectedYear" (change)="load()"
                class="text-body-md border border-outline-variant rounded-lg px-3 py-1.5 bg-surface-container-lowest text-on-surface focus:border-primary focus:outline-none">
          @for (y of years; track y) {
            <option [value]="y">{{ y }}</option>
          }
        </select>

        <!-- Initial Balance -->
        <div class="flex items-center gap-2 border border-outline-variant rounded-lg px-3 py-1.5 bg-surface-container-lowest">
          <span class="font-label-caps text-label-caps text-on-surface-variant whitespace-nowrap">Solde initial</span>
          <input type="number" min="0" [(ngModel)]="initialBalance"
                 class="w-28 border-none outline-none font-data-tabular text-data-tabular text-right text-on-surface bg-transparent"
                 placeholder="0" />
          <button (click)="saveInitialBalance()"
                  class="px-3 py-1 bg-primary text-on-primary rounded font-label-caps text-label-caps uppercase hover:bg-primary/90 transition-colors text-xs">
            Définir
          </button>
        </div>

        <button (click)="exportExcel()" [disabled]="exporting"
                class="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps uppercase hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60">
          <span class="material-symbols-outlined" style="font-size: 18px;">{{ exporting ? 'progress_activity' : 'table_view' }}</span>
          {{ exporting ? 'Export...' : 'Exporter Excel' }}
        </button>
      </div>
    </div>
  </header>

  <!-- ── Loading ── -->
  @if (loading) {
    <div class="flex flex-col justify-center items-center py-24 gap-4">
      <span class="material-symbols-outlined animate-spin text-primary" style="font-size: 40px;">progress_activity</span>
      <p class="font-body-md text-body-md text-on-surface-variant">Chargement du bilan {{ selectedYear }}…</p>
    </div>
  }

  @else if (report) {
  <div class="p-4 md:p-container-padding space-y-6 flex-1">

    <!-- ── Summary Cards ── -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">

      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-secondary" style="font-size: 20px;">savings</span>
          <span class="font-label-caps text-label-caps uppercase text-secondary">Solde Initial</span>
        </div>
        <div class="font-headline-sm text-headline-sm text-on-surface">{{ report.InitialBalance | number:'1.0-0' }}</div>
        <div class="font-label-caps text-label-caps text-on-surface-variant">FCFA</div>
      </div>

      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary" style="font-size: 20px;">payments</span>
          <span class="font-label-caps text-label-caps uppercase text-secondary">Total Recettes</span>
        </div>
        <div class="font-headline-sm text-headline-sm text-primary">{{ report.TotalReceipts | number:'1.0-0' }}</div>
        <div class="font-label-caps text-label-caps text-on-surface-variant">FCFA</div>
      </div>

      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-error" style="font-size: 20px;">money_off</span>
          <span class="font-label-caps text-label-caps uppercase text-secondary">Total Dépenses</span>
        </div>
        <div class="font-headline-sm text-headline-sm text-error">{{ totalExpenses | number:'1.0-0' }}</div>
        <div class="font-label-caps text-label-caps text-on-surface-variant">FCFA</div>
      </div>

      <div class="rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden"
           [class.bg-primary]="report.ClosingBalance >= 0"
           [class.bg-error]="report.ClosingBalance < 0">
        <div class="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full pointer-events-none"></div>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-on-primary" style="font-size: 20px;">account_balance</span>
          <span class="font-label-caps text-label-caps uppercase text-on-primary/80">Solde Clôture</span>
        </div>
        <div class="font-headline-sm text-headline-sm text-primary-fixed">{{ report.ClosingBalance | number:'1.0-0' }}</div>
        <div class="font-label-caps text-label-caps text-on-primary/60">FCFA</div>
      </div>

    </div>

    <!-- ── Mini Profit Bar Chart ── -->
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
      <div class="flex items-center gap-2 mb-4">
        <span class="w-1 h-5 bg-primary rounded-full"></span>
        <h3 class="font-headline-sm text-headline-sm text-on-surface">Évolution mensuelle — {{ selectedYear }}</h3>
      </div>
      <div class="flex items-end gap-1 h-20 overflow-x-auto pb-1">
        @for (ms of report.Months; track ms.Month) {
          <div class="flex flex-col items-center gap-1 flex-1 min-w-[32px]" [title]="monthName(ms.Month) + ' : ' + (ms.Profit | number:'1.0-0') + ' FCFA'">
            <div class="w-full rounded-t-sm transition-all"
                 [style.height.px]="barHeight(ms.Profit)"
                 [class.bg-primary]="ms.Profit >= 0"
                 [class.bg-error]="ms.Profit < 0">
            </div>
            <span class="font-label-caps text-[9px] text-on-surface-variant uppercase whitespace-nowrap">
              {{ monthName(ms.Month).substring(0,3) }}
            </span>
          </div>
        }
      </div>
      <div class="flex justify-between items-center mt-2 border-t border-outline-variant/50 pt-2">
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1 font-label-caps text-label-caps text-primary">
            <span class="w-2.5 h-2.5 rounded-sm bg-primary inline-block"></span> Bénéfice
          </span>
          <span class="flex items-center gap-1 font-label-caps text-label-caps text-error">
            <span class="w-2.5 h-2.5 rounded-sm bg-error inline-block"></span> Déficit
          </span>
        </div>
        <span class="font-label-caps text-label-caps text-on-surface-variant">Bénéfice total : {{ report.TotalProfit | number:'1.0-0' }} FCFA</span>
      </div>
    </div>

    <!-- ── Annual Table ── -->
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div class="bg-surface border-b border-outline-variant px-4 py-3 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <span class="w-1 h-5 bg-tertiary rounded-full"></span>
          <h3 class="font-headline-sm text-headline-sm text-on-surface">Détail Mensuel — {{ selectedYear }}</h3>
        </div>
        <span class="font-label-caps text-label-caps uppercase text-secondary">Montants en FCFA</span>
      </div>

      <div class="table-scroll overflow-x-auto">
        <table class="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr class="bg-surface-container-low border-b border-outline-variant">
              <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3 sticky left-0 bg-surface-container-low z-10 w-28">Mois</th>
              <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3 text-right whitespace-nowrap">Solde Préc.</th>
              <th class="font-label-caps text-label-caps text-primary uppercase px-4 py-3 text-right whitespace-nowrap bg-primary/5 border-l border-outline-variant/30">Recettes</th>
              <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3 text-right whitespace-nowrap">Honoraires</th>
              <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3 text-right whitespace-nowrap">Autres Dép.</th>
              <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3 text-right whitespace-nowrap">Investiss.</th>
              <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3 text-right whitespace-nowrap">Bénéfice</th>
              <th class="font-label-caps text-label-caps text-primary uppercase px-4 py-3 text-right whitespace-nowrap bg-primary/5 border-l border-outline-variant/30">Solde Clôture</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/50">
            @for (ms of report.Months; track ms.Month) {
              <tr class="hover:bg-surface-container-low transition-colors"
                  [class.opacity-40]="isFutureMonth(ms.Month)">
                <td class="font-body-md text-body-md px-4 py-3 sticky left-0 bg-surface-container-lowest font-semibold text-on-surface whitespace-nowrap">
                  {{ monthName(ms.Month) }}
                </td>
                <td class="font-data-tabular text-data-tabular px-4 py-3 text-right text-on-surface-variant">{{ ms.PreviousBalance | number:'1.0-0' }}</td>
                <td class="font-data-tabular text-data-tabular px-4 py-3 text-right text-primary font-bold bg-primary/5 border-l border-outline-variant/30">{{ ms.TotalReceipts | number:'1.0-0' }}</td>
                <td class="font-data-tabular text-data-tabular px-4 py-3 text-right text-on-surface">{{ ms.TotalHonoraires | number:'1.0-0' }}</td>
                <td class="font-data-tabular text-data-tabular px-4 py-3 text-right text-on-surface">{{ ms.OtherExpenses | number:'1.0-0' }}</td>
                <td class="font-data-tabular text-data-tabular px-4 py-3 text-right text-on-surface">{{ ms.TotalInvestments | number:'1.0-0' }}</td>
                <td class="font-data-tabular text-data-tabular px-4 py-3 text-right font-bold"
                    [class.text-primary]="ms.Profit >= 0"
                    [class.text-error]="ms.Profit < 0">
                  {{ ms.Profit >= 0 ? '+' : '' }}{{ ms.Profit | number:'1.0-0' }}
                </td>
                <td class="font-data-tabular text-data-tabular px-4 py-3 text-right font-bold text-on-surface bg-primary/5 border-l border-outline-variant/30">{{ ms.ClosingBalance | number:'1.0-0' }}</td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr class="bg-surface-container-low border-t-2 border-outline-variant">
              <td class="font-label-caps text-label-caps text-on-surface uppercase px-4 py-4 sticky left-0 bg-surface-container-low z-10 font-bold">Total Annuel</td>
              <td class="font-data-tabular text-data-tabular px-4 py-4 text-right text-on-surface-variant">—</td>
              <td class="font-data-tabular text-data-tabular px-4 py-4 text-right font-bold text-primary text-lg bg-primary/5 border-l border-outline-variant/30">{{ report.TotalReceipts | number:'1.0-0' }}</td>
              <td class="font-data-tabular text-data-tabular px-4 py-4 text-right font-bold text-on-surface">{{ report.TotalHonoraires | number:'1.0-0' }}</td>
              <td class="font-data-tabular text-data-tabular px-4 py-4 text-right font-bold text-on-surface">{{ report.TotalOtherExp | number:'1.0-0' }}</td>
              <td class="font-data-tabular text-data-tabular px-4 py-4 text-right font-bold text-on-surface">{{ report.TotalInvestments | number:'1.0-0' }}</td>
              <td class="font-data-tabular text-data-tabular px-4 py-4 text-right font-bold text-primary">+{{ report.TotalProfit | number:'1.0-0' }}</td>
              <td class="font-data-tabular text-data-tabular px-4 py-4 text-right font-bold text-primary text-lg bg-primary/5 border-l border-outline-variant/30">{{ report.ClosingBalance | number:'1.0-0' }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- ── Annual Summary Card ── -->
    <div class="bg-primary text-on-primary rounded-xl p-6 shadow-sm relative overflow-hidden">
      <div class="absolute -right-12 -top-12 w-48 h-48 bg-primary-container/30 rounded-full pointer-events-none"></div>
      <div class="absolute -left-6 -bottom-10 w-32 h-32 bg-primary-container/20 rounded-full pointer-events-none"></div>

      <h4 class="font-headline-sm text-headline-sm text-primary-fixed mb-5 flex items-center gap-2 relative z-10">
        <span class="material-symbols-outlined">summarize</span>
        Synthèse Annuelle {{ selectedYear }}
      </h4>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        <div class="bg-on-primary/10 rounded-xl p-4">
          <div class="font-label-caps text-label-caps text-on-primary/70 mb-1">Solde Initial</div>
          <div class="font-data-tabular text-headline-sm text-primary-fixed font-bold">{{ report.InitialBalance | number:'1.0-0' }}</div>
          <div class="font-label-caps text-label-caps text-on-primary/50 mt-1">FCFA</div>
        </div>
        <div class="bg-on-primary/10 rounded-xl p-4">
          <div class="font-label-caps text-label-caps text-on-primary/70 mb-1">Total Recettes</div>
          <div class="font-data-tabular text-headline-sm text-primary-fixed font-bold">{{ report.TotalReceipts | number:'1.0-0' }}</div>
          <div class="font-label-caps text-label-caps text-on-primary/50 mt-1">FCFA</div>
        </div>
        <div class="bg-on-primary/10 rounded-xl p-4">
          <div class="font-label-caps text-label-caps text-on-primary/70 mb-1">Total Dépenses</div>
          <div class="font-data-tabular text-headline-sm text-error-container font-bold">{{ totalExpenses | number:'1.0-0' }}</div>
          <div class="font-label-caps text-label-caps text-on-primary/50 mt-1">FCFA</div>
        </div>
        <div class="bg-on-primary/20 rounded-xl p-4 border border-primary-fixed/30">
          <div class="font-label-caps text-label-caps text-on-primary/70 mb-1">Solde de Clôture</div>
          <div class="font-data-tabular text-headline-sm text-primary-fixed font-bold">{{ report.ClosingBalance | number:'1.0-0' }}</div>
          <div class="font-label-caps text-label-caps text-on-primary/50 mt-1">FCFA</div>
        </div>
      </div>
    </div>

  </div>
  }

  <!-- ── Fixed Bottom Action Bar ── -->
  <div class="fixed bottom-0 left-0 md:left-[260px] right-0 bg-surface border-t border-outline-variant p-4 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] no-print">
    <div class="max-w-screen-xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
      <div class="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
        <span class="material-symbols-outlined" style="font-size: 18px;">info</span>
        Bilan annuel — Exercice {{ selectedYear }}
      </div>
      <div class="flex gap-3 w-full sm:w-auto">
        <button type="button" (click)="exportExcel()" [disabled]="exporting"
                class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps uppercase hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60">
          <span class="material-symbols-outlined" style="font-size: 18px;">{{ exporting ? 'progress_activity' : 'table_view' }}</span>
          {{ exporting ? 'Génération...' : 'Exporter Excel' }}
        </button>
      </div>
    </div>
  </div>

</div>
  `,
})
export class BilanAnnuelComponent implements OnInit {
  private financeService = inject(FinanceService);
  private toast = inject(ToastService);

  years: number[] = [];
  selectedYear = new Date().getFullYear();
  loading = false;
  exporting = false;
  report: AnnualReport | null = null;
  initialBalance = 0;

  get totalExpenses(): number {
    if (!this.report) return 0;
    return this.report.TotalHonoraires + this.report.TotalOtherExp + this.report.TotalInvestments;
  }

  ngOnInit(): void {
    const y = new Date().getFullYear();
    for (let i = y - 2; i <= y + 1; i++) this.years.push(i);
    this.load();
  }

  prevYear(): void {
    this.selectedYear = +this.selectedYear - 1;
    this.load();
  }

  nextYear(): void {
    this.selectedYear = +this.selectedYear + 1;
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    const year = +this.selectedYear;
    try {
      const [report, settings] = await Promise.all([
        this.financeService.getAnnualReport(year),
        this.financeService.getYearSettings(year),
      ]);
      this.report = report;
      this.initialBalance = settings.InitialBalance || 0;
    } catch (err) {
      this.toast.error('Erreur chargement: ' + err);
    } finally {
      this.loading = false;
    }
  }

  async saveInitialBalance(): Promise<void> {
    try {
      await this.financeService.setInitialBalance(+this.selectedYear, this.initialBalance);
      this.toast.success('Solde initial défini');
      await this.load();
    } catch (err) {
      this.toast.error('Erreur: ' + err);
    }
  }

  async exportExcel(): Promise<void> {
    this.exporting = true;
    try {
      const filePath = await this.financeService.exportAnnualExcel(+this.selectedYear);
      this.toast.success('Fichier Excel généré');
      await this.financeService.openDoc(filePath);
    } catch (err) {
      this.toast.error('Erreur export: ' + err);
    } finally {
      this.exporting = false;
    }
  }

  monthName(m: number): string { return MONTHS_FR[m - 1]; }

  isFutureMonth(m: number): boolean {
    const now = new Date();
    return this.selectedYear === now.getFullYear() && m > now.getMonth() + 1;
  }

  barHeight(profit: number): number {
    if (!this.report) return 0;
    const allProfits = this.report.Months.map(ms => Math.abs(ms.Profit));
    const max = Math.max(...allProfits, 1);
    return Math.round((Math.abs(profit) / max) * 64) + 4;
  }
}
