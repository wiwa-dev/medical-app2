import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, MonthlyReport, MonthlyHonoraire, Investment } from '../../core/services/finance.service';
import { ToastService } from '../../core/services/toast.service';

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

interface HonoraireRow { personName: string; role: string; amount: number; }
interface InvestmentRow { description: string; amount: number; }

@Component({
  selector: 'app-rapport-mensuel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="flex flex-col min-h-screen bg-background pb-24">

  <!-- ── Sticky Header ── -->
  <header class="sticky top-0 z-10 w-full bg-surface border-b border-outline-variant no-print">
    <div class="flex justify-between items-center px-container-padding h-16">

      <!-- Month navigation -->
      <div class="flex items-center gap-4 flex-1 justify-center md:justify-start">
        <button (click)="prevMonth()" aria-label="Mois précédent"
                class="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <h2 class="font-headline-md text-headline-md text-on-surface font-bold capitalize min-w-[220px] text-center">
          {{ monthLabel }} {{ selectedYear }}
        </h2>
        <button (click)="nextMonth()" aria-label="Mois suivant"
                class="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      <!-- Controls -->
      <div class="hidden md:flex items-center gap-3">
        <select [(ngModel)]="selectedMonth" (change)="load()"
                class="text-body-md border border-outline-variant rounded-lg px-3 py-1.5 bg-surface-container-lowest text-on-surface focus:border-primary focus:outline-none">
          @for (m of months; track $index) {
            <option [value]="$index + 1">{{ m }}</option>
          }
        </select>
        <select [(ngModel)]="selectedYear" (change)="load()"
                class="text-body-md border border-outline-variant rounded-lg px-3 py-1.5 bg-surface-container-lowest text-on-surface focus:border-primary focus:outline-none">
          @for (y of years; track y) {
            <option [value]="y">{{ y }}</option>
          }
        </select>
        <button (click)="print()"
                class="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps uppercase hover:bg-primary/90 transition-colors shadow-sm">
          <span class="material-symbols-outlined" style="font-size: 18px;">picture_as_pdf</span>
          Imprimer PDF
        </button>
      </div>
    </div>
  </header>

  <!-- ── Loading ── -->
  @if (loading) {
    <div class="flex flex-col justify-center items-center py-24 gap-4">
      <span class="material-symbols-outlined animate-spin text-primary" style="font-size: 40px;">progress_activity</span>
      <p class="font-body-md text-body-md text-on-surface-variant">Chargement du rapport…</p>
    </div>
  }

  @else if (report) {
  <div class="p-4 md:p-container-padding space-y-6 flex-1" id="rapport-print">

    <!-- ── Document Header (print only) ── -->
    <div class="hidden print:flex justify-between items-start pb-4 border-b border-outline-variant mb-6">
      <div>
        <h1 class="font-headline-md text-headline-md text-primary font-bold">CMSFP Dakar</h1>
        <p class="font-body-md text-body-md text-on-surface-variant">Rapport Financier Mensuel</p>
      </div>
      <div class="text-right">
        <p class="font-label-caps text-label-caps text-on-surface-variant">Période</p>
        <p class="font-data-tabular text-data-tabular text-on-surface">{{ periodLabel }}</p>
        <p class="font-label-caps text-label-caps text-on-surface-variant mt-2">Devise</p>
        <p class="font-data-tabular text-data-tabular text-on-surface">Franc CFA (XOF)</p>
      </div>
    </div>

    <!-- ── Summary Cards ── -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">

      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary" style="font-size: 20px;">payments</span>
          <span class="font-label-caps text-label-caps uppercase text-secondary">Total Recettes</span>
        </div>
        <div class="font-headline-sm text-headline-sm text-on-surface">{{ report.TotalReceipts | number:'1.0-0' }}</div>
        <div class="font-label-caps text-label-caps text-on-surface-variant">FCFA</div>
      </div>

      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-secondary" style="font-size: 20px;">group</span>
          <span class="font-label-caps text-label-caps uppercase text-secondary">Honoraires</span>
        </div>
        <div class="font-headline-sm text-headline-sm text-on-surface">{{ report.TotalHonoraires | number:'1.0-0' }}</div>
        <div class="font-label-caps text-label-caps text-on-surface-variant">FCFA</div>
      </div>

      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-error" style="font-size: 20px;">money_off</span>
          <span class="font-label-caps text-label-caps uppercase text-secondary">Total Dépenses</span>
        </div>
        <div class="font-headline-sm text-headline-sm text-error">{{ report.TotalExpenses | number:'1.0-0' }}</div>
        <div class="font-label-caps text-label-caps text-on-surface-variant">FCFA</div>
      </div>

      <div class="rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden"
           [class.bg-primary]="report.FinalBalance >= 0"
           [class.bg-error]="report.FinalBalance < 0">
        <div class="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full pointer-events-none"></div>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-on-primary" style="font-size: 20px;">account_balance_wallet</span>
          <span class="font-label-caps text-label-caps uppercase text-on-primary/80">Solde Final</span>
        </div>
        <div class="font-headline-sm text-headline-sm text-primary-fixed">{{ report.FinalBalance | number:'1.0-0' }}</div>
        <div class="font-label-caps text-label-caps text-on-primary/60">FCFA</div>
      </div>

    </div>

    <!-- ── SECTION 1 : RECETTES ── -->
    <section>
      <div class="flex items-center gap-2 mb-3">
        <span class="w-1 h-6 bg-primary rounded-full"></span>
        <h3 class="font-headline-sm text-headline-sm text-on-surface">RECETTES</h3>
        <span class="font-label-caps text-label-caps text-on-surface-variant ml-auto">Montants en FCFA</span>
      </div>

      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div class="table-scroll overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant">
                <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3 sticky left-0 bg-surface-container-low z-10 min-w-[160px]">Service</th>
                @for (w of weekHeaders; track $index) {
                  <th class="font-label-caps text-label-caps text-secondary uppercase px-3 py-3 text-right min-w-[90px]">{{ w }}</th>
                }
                <th class="font-label-caps text-label-caps text-primary uppercase px-4 py-3 text-right bg-primary/5 border-l border-outline-variant/50 min-w-[110px]">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/50">
              @for (svc of report.Services; track svc.Service) {
                <tr class="hover:bg-surface-container-low transition-colors group">
                  <td class="font-body-md text-body-md px-4 py-2.5 sticky left-0 bg-surface-container-lowest font-medium text-on-surface">{{ svc.Service }}</td>
                  @for (w of svc.Weeks; track $index) {
                    <td class="font-data-tabular text-data-tabular px-3 py-2.5 text-right text-on-surface">{{ w | number:'1.0-0' }}</td>
                  }
                  <td class="font-data-tabular text-data-tabular px-4 py-2.5 text-right font-bold text-primary bg-primary/5 border-l border-outline-variant/50">{{ svc.Total | number:'1.0-0' }}</td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr class="bg-surface-container-low border-t-2 border-outline-variant">
                <td class="font-label-caps text-label-caps text-on-surface uppercase px-4 py-3 sticky left-0 bg-surface-container-low z-10 font-bold">TOTAL RECETTES</td>
                @for (wt of report.WeekTotals; track $index) {
                  <td class="font-data-tabular text-data-tabular px-3 py-3 text-right font-bold text-on-surface">{{ wt | number:'1.0-0' }}</td>
                }
                <td class="font-data-tabular text-data-tabular px-4 py-3 text-right font-bold text-primary text-lg bg-primary/5 border-l border-outline-variant/50">{{ report.TotalReceipts | number:'1.0-0' }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>

    <!-- ── SECTION 2 : DÉPENSES ── -->
    <section>
      <div class="flex items-center gap-2 mb-3">
        <span class="w-1 h-6 bg-error rounded-full"></span>
        <h3 class="font-headline-sm text-headline-sm text-on-surface">DÉPENSES</h3>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <!-- Honoraires du Personnel -->
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div class="bg-surface border-b border-outline-variant px-4 py-3 flex justify-between items-center">
            <h4 class="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
              <span class="material-symbols-outlined text-secondary" style="font-size: 18px;">group</span>
              Honoraires du Personnel
            </h4>
            <button (click)="editHonoraires = !editHonoraires"
                    class="flex items-center gap-1 px-3 py-1.5 rounded-lg font-label-caps text-label-caps uppercase transition-colors"
                    [class.bg-primary]="editHonoraires"
                    [class.text-on-primary]="editHonoraires"
                    [class.bg-surface-container-low]="!editHonoraires"
                    [class.text-on-surface]="!editHonoraires">
              <span class="material-symbols-outlined" style="font-size: 14px;">{{ editHonoraires ? 'close' : 'edit' }}</span>
              {{ editHonoraires ? 'Fermer' : 'Modifier' }}
            </button>
          </div>

          @if (editHonoraires) {
            <div class="p-4 bg-surface-container-low border-b border-outline-variant flex flex-col gap-3">
              @for (h of honoraireRows; track $index) {
                <div class="flex gap-2 items-center">
                  <input type="text" [(ngModel)]="h.personName" placeholder="Nom complet"
                         class="flex-1 border border-outline-variant rounded-lg px-3 py-2 font-body-md text-body-md bg-surface-container-lowest focus:border-primary focus:outline-none" />
                  <input type="text" [(ngModel)]="h.role" placeholder="Rôle"
                         class="w-28 border border-outline-variant rounded-lg px-3 py-2 font-body-md text-body-md bg-surface-container-lowest focus:border-primary focus:outline-none" />
                  <input type="number" min="0" [(ngModel)]="h.amount" placeholder="0"
                         class="med-input w-28 font-data-tabular text-data-tabular border border-outline-variant rounded-lg" />
                  <button (click)="removeHonoraire($index)"
                          class="p-2 text-on-surface-variant hover:text-error rounded-lg hover:bg-error-container/20 transition-colors">
                    <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
                  </button>
                </div>
              }
              <div class="flex gap-3 mt-1">
                <button (click)="addHonoraire()"
                        class="text-primary font-body-md font-medium flex items-center gap-1 hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors">
                  <span class="material-symbols-outlined" style="font-size: 16px;">add</span> Ajouter
                </button>
                <button (click)="saveHonoraires()"
                        class="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps uppercase hover:bg-primary/90 transition-colors shadow-sm">
                  <span class="material-symbols-outlined" style="font-size: 16px;">save</span>
                  Enregistrer
                </button>
              </div>
            </div>
          }

          <div class="table-scroll overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container-low border-b border-outline-variant">
                  <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3">Nom &amp; Rôle</th>
                  <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3 text-right">Montant (FCFA)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/50">
                @for (h of report.Honoraires; track h.ID) {
                  <tr class="hover:bg-surface-container-low transition-colors">
                    <td class="px-4 py-3">
                      <div class="font-body-md text-body-md text-on-surface font-medium">{{ h.PersonName }}</div>
                      <div class="font-label-caps text-label-caps text-on-surface-variant mt-0.5">{{ h.Role }}</div>
                    </td>
                    <td class="font-data-tabular text-data-tabular px-4 py-3 text-right text-on-surface">{{ h.Amount | number:'1.0-0' }}</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="2" class="px-4 py-6 text-center font-body-md text-body-md text-on-surface-variant">
                      <span class="material-symbols-outlined block mx-auto mb-2 text-outline" style="font-size: 32px;">person_off</span>
                      Aucun honoraire saisi
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="bg-surface-container-low border-t-2 border-outline-variant">
                  <td class="font-label-caps text-label-caps text-on-surface uppercase px-4 py-3 font-bold">Total Honoraires</td>
                  <td class="font-data-tabular text-data-tabular px-4 py-3 text-right font-bold text-on-surface">{{ report.TotalHonoraires | number:'1.0-0' }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Autres Dépenses + Investissements -->
        <div class="flex flex-col gap-4">

          <!-- Fonctionnement & Autres (from daily entries) -->
          <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div class="bg-surface border-b border-outline-variant px-4 py-3">
              <h4 class="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-error" style="font-size: 18px;">receipt_long</span>
                Fonctionnement &amp; Dépenses
              </h4>
            </div>
            <div class="px-4 py-4 flex justify-between items-center">
              <div>
                <div class="font-body-md text-body-md text-on-surface">Dépenses journalières cumulées</div>
                <div class="font-label-caps text-label-caps text-on-surface-variant mt-0.5">Issu des saisies quotidiennes du mois</div>
              </div>
              <div class="font-data-tabular text-data-tabular font-bold text-on-surface">{{ report.OtherExpensesTotal | number:'1.0-0' }}</div>
            </div>
            <div class="bg-surface-container-low border-t border-outline-variant px-4 py-3 flex justify-between items-center">
              <span class="font-label-caps text-label-caps text-on-surface uppercase font-bold">Total Fonctionnement</span>
              <span class="font-data-tabular text-data-tabular font-bold text-on-surface">{{ report.OtherExpensesTotal | number:'1.0-0' }}</span>
            </div>
          </div>

          <!-- Investissements -->
          <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm flex-1">
            <div class="bg-surface border-b border-outline-variant px-4 py-3 flex justify-between items-center">
              <h4 class="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
                <span class="material-symbols-outlined text-tertiary" style="font-size: 18px;">trending_up</span>
                Investissements
              </h4>
              <button (click)="editInvestments = !editInvestments"
                      class="flex items-center gap-1 px-3 py-1.5 rounded-lg font-label-caps text-label-caps uppercase transition-colors"
                      [class.bg-primary]="editInvestments"
                      [class.text-on-primary]="editInvestments"
                      [class.bg-surface-container-low]="!editInvestments"
                      [class.text-on-surface]="!editInvestments">
                <span class="material-symbols-outlined" style="font-size: 14px;">{{ editInvestments ? 'close' : 'edit' }}</span>
                {{ editInvestments ? 'Fermer' : 'Modifier' }}
              </button>
            </div>

            @if (editInvestments) {
              <div class="p-4 bg-surface-container-low border-b border-outline-variant flex flex-col gap-3">
                @for (inv of investmentRows; track $index) {
                  <div class="flex gap-2 items-center">
                    <input type="text" [(ngModel)]="inv.description" placeholder="Description de l'investissement"
                           class="flex-1 border border-outline-variant rounded-lg px-3 py-2 font-body-md text-body-md bg-surface-container-lowest focus:border-primary focus:outline-none" />
                    <input type="number" min="0" [(ngModel)]="inv.amount" placeholder="0"
                           class="med-input w-28 font-data-tabular text-data-tabular border border-outline-variant rounded-lg" />
                    <button (click)="removeInvestment($index)"
                            class="p-2 text-on-surface-variant hover:text-error rounded-lg hover:bg-error-container/20 transition-colors">
                      <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
                    </button>
                  </div>
                }
                <div class="flex gap-3 mt-1">
                  <button (click)="addInvestment()"
                          class="text-primary font-body-md font-medium flex items-center gap-1 hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors">
                    <span class="material-symbols-outlined" style="font-size: 16px;">add</span> Ajouter
                  </button>
                  <button (click)="saveInvestments()"
                          class="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps uppercase hover:bg-primary/90 transition-colors shadow-sm">
                    <span class="material-symbols-outlined" style="font-size: 16px;">save</span>
                    Enregistrer
                  </button>
                </div>
              </div>
            }

            <div class="table-scroll overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <tbody class="divide-y divide-outline-variant/50">
                  @for (inv of report.Investments; track inv.ID) {
                    <tr class="hover:bg-surface-container-low transition-colors">
                      <td class="font-body-md text-body-md px-4 py-3 text-on-surface">{{ inv.Description }}</td>
                      <td class="font-data-tabular text-data-tabular px-4 py-3 text-right text-on-surface">{{ inv.Amount | number:'1.0-0' }}</td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="2" class="px-4 py-6 text-center font-body-md text-body-md text-on-surface-variant">
                        <span class="material-symbols-outlined block mx-auto mb-2 text-outline" style="font-size: 32px;">inventory_2</span>
                        Aucun investissement ce mois
                      </td>
                    </tr>
                  }
                </tbody>
                @if (report.Investments.length > 0) {
                  <tfoot>
                    <tr class="bg-surface-container-low border-t-2 border-outline-variant">
                      <td class="font-label-caps text-label-caps text-on-surface uppercase px-4 py-3 font-bold">Total Investissements</td>
                      <td class="font-data-tabular text-data-tabular px-4 py-3 text-right font-bold text-on-surface">{{ report.TotalInvestments | number:'1.0-0' }}</td>
                    </tr>
                  </tfoot>
                }
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Total Dépenses Banner -->
      <div class="mt-4 flex items-center justify-between bg-error-container/30 border border-error/20 rounded-xl px-6 py-4">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-error" style="font-size: 22px;">remove_circle</span>
          <span class="font-headline-sm text-headline-sm text-error font-bold uppercase">Total Dépenses Mensuelles</span>
        </div>
        <span class="font-data-tabular text-headline-sm font-bold text-error">{{ report.TotalExpenses | number:'1.0-0' }} FCFA</span>
      </div>
    </section>

    <!-- ── SECTION 3 : SYNTHÈSE FINANCIÈRE ── -->
    <section>
      <div class="flex items-center gap-2 mb-3">
        <span class="w-1 h-6 bg-tertiary rounded-full"></span>
        <h3 class="font-headline-sm text-headline-sm text-on-surface">SYNTHÈSE FINANCIÈRE</h3>
      </div>

      <div class="bg-primary text-on-primary rounded-xl p-6 shadow-sm relative overflow-hidden">
        <!-- Decorative circles -->
        <div class="absolute -right-12 -top-12 w-48 h-48 bg-primary-container/30 rounded-full pointer-events-none"></div>
        <div class="absolute -left-6 -bottom-10 w-32 h-32 bg-primary-container/20 rounded-full pointer-events-none"></div>

        <h4 class="font-headline-sm text-headline-sm text-primary-fixed mb-5 flex items-center gap-2 relative z-10">
          <span class="material-symbols-outlined">account_balance_wallet</span>
          Synthèse — {{ monthLabel }} {{ selectedYear }}
        </h4>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          <!-- Left column: Flux -->
          <div class="flex flex-col gap-3">
            <div class="flex justify-between items-center py-2 border-b border-on-primary/20">
              <span class="font-body-md text-body-md text-on-primary/80">Report du mois précédent</span>
              <span class="font-data-tabular text-data-tabular text-primary-fixed font-bold">{{ report.PreviousBalance | number:'1.0-0' }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-on-primary/20">
              <span class="font-body-md text-body-md text-on-primary/80">+ Total Recettes</span>
              <span class="font-data-tabular text-data-tabular text-primary-fixed font-bold">{{ report.TotalReceipts | number:'1.0-0' }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-on-primary/20">
              <span class="font-body-md text-body-md text-on-primary/80">− Honoraires</span>
              <span class="font-data-tabular text-data-tabular text-error-container font-bold">{{ report.TotalHonoraires | number:'1.0-0' }}</span>
            </div>
            <div class="flex justify-between items-center py-2">
              <span class="font-body-md text-body-md text-on-primary/80">− Autres Dépenses</span>
              <span class="font-data-tabular text-data-tabular text-error-container font-bold">{{ report.OtherExpensesTotal | number:'1.0-0' }}</span>
            </div>
          </div>

          <!-- Right column: Résultat -->
          <div class="flex flex-col gap-3">
            <div class="flex justify-between items-center py-2 border-b border-on-primary/20">
              <span class="font-body-md text-body-md text-on-primary font-semibold">Bénéfice d'Exploitation</span>
              <span class="font-data-tabular text-data-tabular text-primary-fixed font-bold text-lg">{{ report.Profit | number:'1.0-0' }}</span>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-on-primary/20">
              <span class="font-body-md text-body-md text-on-primary/80">− Investissements</span>
              <span class="font-data-tabular text-data-tabular text-error-container font-bold">{{ report.TotalInvestments | number:'1.0-0' }}</span>
            </div>

            <!-- Final Balance -->
            <div class="mt-2 bg-on-primary/10 rounded-xl px-4 py-4 flex justify-between items-center">
              <span class="font-headline-sm text-headline-sm text-primary-fixed font-bold">SOLDE FINAL DISPONIBLE</span>
              <div class="text-right">
                <div class="font-data-tabular font-bold text-2xl text-primary-fixed">{{ report.FinalBalance | number:'1.0-0' }}</div>
                <div class="font-label-caps text-label-caps text-on-primary/60">FCFA</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Signatures (print) ── -->
    <div class="mt-8 pt-8 border-t border-outline-variant flex justify-between px-8 print:flex hidden">
      <div class="text-center">
        <p class="font-label-caps text-label-caps text-on-surface-variant mb-12">Le Chef de Centre</p>
        <div class="w-48 border-b border-dashed border-outline-variant"></div>
        <p class="font-label-caps text-label-caps text-on-surface-variant mt-2">Signature &amp; Cachet</p>
      </div>
      <div class="text-center">
        <p class="font-label-caps text-label-caps text-on-surface-variant mb-12">Le Responsable Financier</p>
        <div class="w-48 border-b border-dashed border-outline-variant"></div>
        <p class="font-label-caps text-label-caps text-on-surface-variant mt-2">Signature &amp; Cachet</p>
      </div>
    </div>

  </div>
  }

  <!-- ── Fixed Bottom Action Bar ── -->
  <div class="fixed bottom-0 left-0 md:left-[260px] right-0 bg-surface border-t border-outline-variant p-4 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] no-print">
    <div class="max-w-screen-xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
      <div class="font-body-md text-body-md text-on-surface-variant flex items-center gap-2">
        <span class="material-symbols-outlined" style="font-size: 18px;">info</span>
        Rapport mensuel — {{ monthLabel }} {{ selectedYear }}
      </div>
      <div class="flex gap-3 w-full sm:w-auto">
        <button type="button" (click)="print()"
                class="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps uppercase hover:bg-primary/90 transition-colors shadow-sm">
          <span class="material-symbols-outlined" style="font-size: 18px;">picture_as_pdf</span>
          Imprimer / PDF
        </button>
      </div>
    </div>
  </div>

</div>
  `,
})
export class RapportMensuelComponent implements OnInit {
  private financeService = inject(FinanceService);
  private toast = inject(ToastService);

  months = MONTHS;
  years: number[] = [];
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();

  loading = false;
  report: MonthlyReport | null = null;

  editHonoraires = false;
  editInvestments = false;
  honoraireRows: HonoraireRow[] = [{ personName: '', role: '', amount: 0 }];
  investmentRows: InvestmentRow[] = [{ description: '', amount: 0 }];

  get monthLabel(): string { return MONTHS[this.selectedMonth - 1]; }

  get weekHeaders(): string[] {
    const count = this.report?.WeekCount || 4;
    return Array.from({ length: count }, (_, i) => `Sem. ${i + 1}`);
  }

  get periodLabel(): string {
    const lastDay = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    return `01/${String(this.selectedMonth).padStart(2,'0')}/${this.selectedYear} — ${lastDay}/${String(this.selectedMonth).padStart(2,'0')}/${this.selectedYear}`;
  }

  ngOnInit(): void {
    const y = new Date().getFullYear();
    for (let i = y - 2; i <= y + 1; i++) this.years.push(i);
    this.load();
  }

  prevMonth(): void {
    const m = +this.selectedMonth;
    const y = +this.selectedYear;
    if (m === 1) { this.selectedMonth = 12; this.selectedYear = y - 1; }
    else { this.selectedMonth = m - 1; }
    this.load();
  }

  nextMonth(): void {
    const m = +this.selectedMonth;
    const y = +this.selectedYear;
    if (m === 12) { this.selectedMonth = 1; this.selectedYear = y + 1; }
    else { this.selectedMonth = m + 1; }
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.editHonoraires = false;
    this.editInvestments = false;
    const month = +this.selectedMonth;
    const year = +this.selectedYear;
    try {
      const [report, honoraires, investments] = await Promise.all([
        this.financeService.getMonthlyReport(month, year),
        this.financeService.getMonthlyHonoraires(month, year),
        this.financeService.getInvestments(month, year),
      ]);
      this.report = report;
      this.honoraireRows = honoraires.length
        ? honoraires.map(h => ({ personName: h.PersonName, role: h.Role, amount: h.Amount }))
        : [{ personName: '', role: '', amount: 0 }];
      this.investmentRows = investments.length
        ? investments.map(i => ({ description: i.Description, amount: i.Amount }))
        : [{ description: '', amount: 0 }];
    } catch (err) {
      this.toast.error('Erreur chargement: ' + err);
    } finally {
      this.loading = false;
    }
  }

  addHonoraire(): void { this.honoraireRows.push({ personName: '', role: '', amount: 0 }); }
  removeHonoraire(i: number): void { this.honoraireRows.splice(i, 1); }
  addInvestment(): void { this.investmentRows.push({ description: '', amount: 0 }); }
  removeInvestment(i: number): void { this.investmentRows.splice(i, 1); }

  async saveHonoraires(): Promise<void> {
    const month = +this.selectedMonth;
    const year = +this.selectedYear;
    try {
      const payload: any[] = this.honoraireRows
        .filter(h => h.personName.trim() || h.amount > 0)
        .map(h => ({ Month: month, Year: year, PersonName: h.personName, Role: h.role, Amount: h.amount || 0 }));
      await this.financeService.saveMonthlyHonoraires(month, year, payload);
      this.toast.success('Honoraires enregistrés');
      this.editHonoraires = false;
      await this.load();
    } catch (err) {
      this.toast.error('Erreur: ' + err);
    }
  }

  async saveInvestments(): Promise<void> {
    const month = +this.selectedMonth;
    const year = +this.selectedYear;
    try {
      const payload: any[] = this.investmentRows
        .filter(i => i.description.trim() || i.amount > 0)
        .map(i => ({ Month: month, Year: year, Description: i.description, Amount: i.amount || 0 }));
      await this.financeService.saveInvestments(month, year, payload);
      this.toast.success('Investissements enregistrés');
      this.editInvestments = false;
      await this.load();
    } catch (err) {
      this.toast.error('Erreur: ' + err);
    }
  }

  print(): void { window.print(); }
}
