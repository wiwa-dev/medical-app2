import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService, Supplier, SupplierExpense, SupplierBudgetSummary } from '../../core/services/finance.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-gestion-fournisseurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="flex flex-col min-h-screen bg-background pb-24">

  <!-- ── Header ── -->
  <header class="sticky top-0 z-10 w-full bg-surface border-b border-outline-variant no-print">
    <div class="flex justify-between items-center px-container-padding h-16">
      <h2 class="font-headline-md text-headline-md text-on-surface font-bold flex items-center gap-2">
        <span class="material-symbols-outlined text-primary" style="font-size: 24px;">handshake</span>
        Gestion des Fournisseurs
      </h2>
    </div>
  </header>

  <div class="p-4 md:p-container-padding space-y-6 flex-1">

    <!-- ── Add / Edit Supplier Form ── -->
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-sm">
      <h3 class="font-headline-sm text-headline-sm text-on-surface mb-4 flex items-center gap-2">
        <span class="material-symbols-outlined text-primary" style="font-size: 20px;">
          {{ editingSupplier ? 'edit' : 'add_circle' }}
        </span>
        {{ editingSupplier ? 'Modifier le fournisseur' : 'Ajouter un fournisseur' }}
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="font-label-caps text-label-caps text-on-surface-variant block mb-1">Nom du fournisseur</label>
          <input type="text" [(ngModel)]="formName" placeholder="Ex: Fournitures médicales SARL"
                 class="w-full border border-outline-variant rounded-lg px-3 py-2 font-body-md text-body-md bg-surface-container-lowest focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label class="font-label-caps text-label-caps text-on-surface-variant block mb-1">Année budgétaire</label>
          <input type="number" min="1900" max="2100" [(ngModel)]="formBudgetYear" list="yearSuggestions"
                 placeholder="Ex: 2026"
                 class="w-full border border-outline-variant rounded-lg px-3 py-2 font-body-md text-body-md bg-surface-container-lowest focus:border-primary focus:outline-none" />
          <datalist id="yearSuggestions">
            @for (y of yearOptions; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </datalist>
        </div>
        <div>
          <label class="font-label-caps text-label-caps text-on-surface-variant block mb-1">Montant engagé (FCFA)</label>
          <input type="number" min="0" [(ngModel)]="formAmountEngaged" placeholder="0"
                 class="w-full border border-outline-variant rounded-lg px-3 py-2 font-body-md text-body-md bg-surface-container-lowest focus:border-primary focus:outline-none font-data-tabular" />
        </div>
      </div>

      <div class="flex gap-3 mt-4">
        <button (click)="saveSupplier()"
                class="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps uppercase hover:bg-primary/90 transition-colors shadow-sm">
          <span class="material-symbols-outlined" style="font-size: 16px;">{{ editingSupplier ? 'save' : 'add' }}</span>
          {{ editingSupplier ? 'Enregistrer' : 'Ajouter' }}
        </button>
        @if (editingSupplier) {
          <button (click)="cancelEdit()"
                  class="flex items-center gap-2 px-5 py-2.5 border border-outline-variant text-on-surface rounded-lg font-label-caps text-label-caps uppercase hover:bg-surface-container-low transition-colors">
            <span class="material-symbols-outlined" style="font-size: 16px;">close</span>
            Annuler
          </button>
        }
      </div>
    </div>

    <!-- ── Suppliers List ── -->
    <div class="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div class="bg-surface border-b border-outline-variant px-4 py-3 flex justify-between items-center">
        <h3 class="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
          <span class="material-symbols-outlined text-primary" style="font-size: 18px;">list_alt</span>
          Liste des fournisseurs
        </h3>
        <div class="flex items-center gap-2">
          <label class="font-label-caps text-label-caps text-on-surface-variant">Filtrer année:</label>
          <select [(ngModel)]="filterYear" (change)="loadSuppliers()"
                  class="border border-outline-variant rounded-lg px-3 py-1.5 font-body-md text-body-md bg-surface-container-lowest focus:border-primary focus:outline-none">
            <option [ngValue]="0">Toutes les années</option>
            @for (y of years; track y) {
              <option [ngValue]="y">{{ y }}</option>
            }
          </select>
        </div>
      </div>

      @if (loading) {
        <div class="flex justify-center items-center py-12">
          <span class="material-symbols-outlined animate-spin text-primary" style="font-size: 32px;">progress_activity</span>
        </div>
      } @else if (suppliers.length === 0) {
        <div class="text-center py-12 text-on-surface-variant">
          <span class="material-symbols-outlined block mx-auto mb-2 text-outline" style="font-size: 40px;">handshake</span>
          <p class="font-body-md text-body-md">Aucun fournisseur trouvé</p>
          <p class="font-label-caps text-label-caps mt-1">Ajoutez un fournisseur avec le formulaire ci-dessus</p>
        </div>
      } @else {
        <div class="table-scroll overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-surface-container-low border-b border-outline-variant">
                <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3">Nom du fournisseur</th>
                <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3 text-right">Année budgétaire</th>
                <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3 text-right">Montant engagé</th>
                <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3 text-right">Dépense réalisée</th>
                <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3 text-right">Restant</th>
                <th class="font-label-caps text-label-caps text-secondary uppercase px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant/50">
              @for (s of suppliers; track s.ID) {
                <tr class="hover:bg-surface-container-low transition-colors">
                  <td class="font-body-md text-body-md px-4 py-3 text-on-surface font-medium">{{ s.Name }}</td>
                  <td class="font-data-tabular text-data-tabular px-4 py-3 text-right text-on-surface">{{ s.BudgetYear }}</td>
                  <td class="font-data-tabular text-data-tabular px-4 py-3 text-right text-on-surface">{{ s.AmountEngaged | number:'1.0-0' }}</td>
                  <td class="font-data-tabular text-data-tabular px-4 py-3 text-right" [class.text-error]="s.TotalExpenses > 0">{{ s.TotalExpenses | number:'1.0-0' }}</td>
                  <td class="font-data-tabular text-data-tabular px-4 py-3 text-right font-bold"
                      [class.text-success]="s.Remaining >= 0"
                      [class.text-error]="s.Remaining < 0">
                    {{ s.Remaining | number:'1.0-0' }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-center gap-1">
                      <button (click)="showExpenses(s)"
                              class="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors"
                              title="Voir les dépenses">
                        <span class="material-symbols-outlined" style="font-size: 18px;">receipt_long</span>
                      </button>
                      <button (click)="startEdit(s)"
                              class="p-2 text-on-surface-variant hover:text-primary rounded-lg transition-colors"
                              title="Modifier">
                        <span class="material-symbols-outlined" style="font-size: 18px;">edit</span>
                      </button>
                      <button (click)="confirmDelete(s)"
                              class="p-2 text-on-surface-variant hover:text-error rounded-lg transition-colors"
                              title="Supprimer">
                        <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
            @if (suppliers.length > 0) {
              <tfoot>
                <tr class="bg-surface-container-low border-t-2 border-outline-variant font-bold">
                  <td class="font-label-caps text-label-caps uppercase text-on-surface px-4 py-3" colspan="2">TOTAL</td>
                  <td class="font-data-tabular text-data-tabular px-4 py-3 text-right text-on-surface">{{ totalEngaged | number:'1.0-0' }}</td>
                  <td class="font-data-tabular text-data-tabular px-4 py-3 text-right text-on-surface">{{ totalExpensesSum | number:'1.0-0' }}</td>
                  <td class="font-data-tabular text-data-tabular px-4 py-3 text-right text-on-surface"
                      [class.text-success]="totalRemaining >= 0"
                      [class.text-error]="totalRemaining < 0">{{ totalRemaining | number:'1.0-0' }}</td>
                  <td></td>
                </tr>
              </tfoot>
            }
          </table>
        </div>
      }
    </div>
  </div>

  <!-- ── Expenses Modal ── -->
  @if (expenseSupplier) {
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="closeExpenses()">
      <div class="bg-surface rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
          <h3 class="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
            <span class="material-symbols-outlined text-primary" style="font-size: 20px;">receipt_long</span>
            Dépenses — {{ expenseSupplier.Name }}
          </h3>
          <button (click)="closeExpenses()" class="p-2 text-on-surface-variant hover:text-error rounded-lg transition-colors">
            <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
          </button>
        </div>

        <!-- Add Expense Form -->
        <div class="p-4 bg-surface-container-low border-b border-outline-variant">
          <div class="flex flex-wrap gap-2 items-end">
            <div class="flex-1 min-w-[120px]">
              <label class="font-label-caps text-label-caps text-on-surface-variant block mb-1">Description</label>
              <input type="text" [(ngModel)]="newExpenseDesc" placeholder="Motif de la dépense"
                     class="w-full border border-outline-variant rounded-lg px-3 py-2 font-body-md text-body-md bg-surface-container-lowest focus:border-primary focus:outline-none" />
            </div>
            <div class="w-28">
              <label class="font-label-caps text-label-caps text-on-surface-variant block mb-1">Montant</label>
              <input type="number" min="0" [(ngModel)]="newExpenseAmount" placeholder="0"
                     class="w-full med-input font-data-tabular text-data-tabular border border-outline-variant rounded-lg" />
            </div>
            <div class="w-36">
              <label class="font-label-caps text-label-caps text-on-surface-variant block mb-1">Date</label>
              <input type="date" [(ngModel)]="newExpenseDate"
                     class="w-full border border-outline-variant rounded-lg px-3 py-2 font-body-md text-body-md bg-surface-container-lowest focus:border-primary focus:outline-none" />
            </div>
            <button (click)="addExpense()"
                    class="flex items-center gap-1 px-4 py-2.5 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps uppercase hover:bg-primary/90 transition-colors shadow-sm">
              <span class="material-symbols-outlined" style="font-size: 16px;">add</span>
              Ajouter
            </button>
          </div>
        </div>

        <!-- Expenses List -->
        <div class="overflow-y-auto flex-1">
          @if (expensesLoading) {
            <div class="flex justify-center py-8">
              <span class="material-symbols-outlined animate-spin text-primary" style="font-size: 24px;">progress_activity</span>
            </div>
          } @else if (expenseList.length === 0) {
            <div class="text-center py-8 text-on-surface-variant">
              <span class="material-symbols-outlined block mx-auto mb-2 text-outline" style="font-size: 32px;">receipt_long</span>
              <p class="font-body-md text-body-md">Aucune dépense enregistrée</p>
            </div>
          } @else {
            <div class="divide-y divide-outline-variant/50">
              @for (e of expenseList; track e.ID) {
                <div class="flex items-center justify-between px-4 py-3 hover:bg-surface-container-low transition-colors">
                  <div class="flex-1">
                    <div class="font-body-md text-body-md text-on-surface">{{ e.Description }}</div>
                    <div class="font-label-caps text-label-caps text-on-surface-variant mt-0.5">{{ e.Date }}</div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="font-data-tabular text-data-tabular text-error font-bold">{{ e.Amount | number:'1.0-0' }}</span>
                    <button (click)="deleteExpense(e)"
                            class="p-2 text-on-surface-variant hover:text-error rounded-lg transition-colors"
                            title="Supprimer">
                      <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Modal Footer with totals -->
        <div class="border-t border-outline-variant px-4 py-3 bg-surface-container-low">
          <div class="flex justify-between items-center">
            <span class="font-label-caps text-label-caps text-on-surface uppercase font-bold">Total dépenses</span>
            <span class="font-data-tabular text-data-tabular text-error font-bold">{{ expenseTotal | number:'1.0-0' }} FCFA</span>
          </div>
          <div class="flex justify-between items-center mt-1">
            <span class="font-label-caps text-label-caps text-on-surface-variant">Montant engagé</span>
            <span class="font-data-tabular text-data-tabular text-on-surface">{{ expenseSupplier.AmountEngaged | number:'1.0-0' }} FCFA</span>
          </div>
          <div class="flex justify-between items-center mt-1">
            <span class="font-label-caps text-label-caps text-on-surface-variant">Restant</span>
            <span class="font-data-tabular text-data-tabular font-bold"
                  [class.text-success]="(expenseSupplier.AmountEngaged - expenseTotal) >= 0"
                  [class.text-error]="(expenseSupplier.AmountEngaged - expenseTotal) < 0">
              {{ expenseSupplier.AmountEngaged - expenseTotal | number:'1.0-0' }} FCFA
            </span>
          </div>
        </div>
      </div>
    </div>
  }

  <!-- ── Delete Confirmation Dialog ── -->
  @if (deleteTarget) {
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" (click)="deleteTarget = null">
      <div class="bg-surface rounded-xl shadow-xl max-w-sm w-full mx-4 p-6" (click)="$event.stopPropagation()">
        <div class="flex items-center gap-3 mb-4">
          <span class="material-symbols-outlined text-error" style="font-size: 28px;">warning</span>
          <h3 class="font-headline-sm text-headline-sm text-on-surface">Confirmer la suppression</h3>
        </div>
        <p class="font-body-md text-body-md text-on-surface-variant mb-2">
          Êtes-vous sûr de vouloir supprimer le fournisseur <strong>{{ deleteTarget.Name }}</strong> ?
        </p>
        <p class="font-label-caps text-label-caps text-error mb-4">
          Attention : Toutes les dépenses associées seront également supprimées.
        </p>
        <div class="flex justify-end gap-3">
          <button (click)="deleteTarget = null"
                  class="px-4 py-2 border border-outline-variant text-on-surface rounded-lg font-label-caps text-label-caps uppercase hover:bg-surface-container-low transition-colors">
            Annuler
          </button>
          <button (click)="doDelete()"
                  class="px-4 py-2 bg-error text-on-error rounded-lg font-label-caps text-label-caps uppercase hover:bg-error/90 transition-colors shadow-sm">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  }

</div>
  `,
})
export class GestionFournisseursComponent implements OnInit {
  private financeService = inject(FinanceService);
  private toast = inject(ToastService);

  years: number[] = [];
  yearOptions: number[] = [];
  filterYear = new Date().getFullYear();

  loading = false;
  suppliers: SupplierBudgetSummary[] = [];

  // Form state
  editingSupplier: Supplier | null = null;
  formName = '';
  formBudgetYear = new Date().getFullYear();
  formAmountEngaged = 0;

  // Expenses modal
  expenseSupplier: SupplierBudgetSummary | null = null;
  expenseList: SupplierExpense[] = [];
  expensesLoading = false;
  newExpenseDesc = '';
  newExpenseAmount = 0;
  newExpenseDate = new Date().toISOString().slice(0, 10);

  // Delete confirmation
  deleteTarget: SupplierBudgetSummary | null = null;

  // Computed totals
  get totalEngaged(): number {
    return this.suppliers.reduce((sum, s) => sum + s.AmountEngaged, 0);
  }

  get totalExpensesSum(): number {
    return this.suppliers.reduce((sum, s) => sum + s.TotalExpenses, 0);
  }

  get totalRemaining(): number {
    return this.suppliers.reduce((sum, s) => sum + s.Remaining, 0);
  }

  get expenseTotal(): number {
    return this.expenseList.reduce((sum, e) => sum + e.Amount, 0);
  }

  ngOnInit(): void {
    const y = new Date().getFullYear();
    for (let i = y - 2; i <= y + 5; i++) this.years.push(i);
    // 4 dernières + courante + 4 prochaines pour la suggestion
    for (let i = y - 4; i <= y + 4; i++) this.yearOptions.push(i);
    this.loadSuppliers();
  }

  async loadSuppliers(): Promise<void> {
    this.loading = true;
    try {
      if (this.filterYear > 0) {
        this.suppliers = await this.financeService.getSupplierBudgetSummary(this.filterYear);
      } else {
        // Load all years
        const allSuppliers: SupplierBudgetSummary[] = [];
        const years = this.years;
        for (const y of years) {
          const data = await this.financeService.getSupplierBudgetSummary(y);
          allSuppliers.push(...data);
        }
        this.suppliers = allSuppliers;
      }
    } catch (err) {
      this.toast.error('Erreur chargement: ' + err);
    } finally {
      this.loading = false;
    }
  }

  async saveSupplier(): Promise<void> {
    const name = this.formName.trim();
    if (!name) {
      this.toast.error('Veuillez saisir le nom du fournisseur');
      return;
    }
    if (this.formAmountEngaged <= 0) {
      this.toast.error('Veuillez saisir un montant engagé valide');
      return;
    }
    try {
      if (this.editingSupplier) {
        await this.financeService.updateSupplier(
          this.editingSupplier.ID,
          name,
          this.formBudgetYear,
          this.formAmountEngaged,
        );
        this.toast.success('Fournisseur mis à jour');
        this.cancelEdit();
      } else {
        await this.financeService.createSupplier(name, this.formBudgetYear, this.formAmountEngaged);
        this.toast.success('Fournisseur ajouté');
        // Reset form
        this.formName = '';
        this.formAmountEngaged = 0;
      }
      await this.loadSuppliers();
    } catch (err) {
      this.toast.error('Erreur: ' + err);
    }
  }

  startEdit(s: SupplierBudgetSummary): void {
    this.editingSupplier = {
      ID: s.ID,
      Name: s.Name,
      BudgetYear: s.BudgetYear,
      AmountEngaged: s.AmountEngaged,
    } as Supplier;
    this.formName = s.Name;
    this.formBudgetYear = s.BudgetYear;
    this.formAmountEngaged = s.AmountEngaged;
  }

  cancelEdit(): void {
    this.editingSupplier = null;
    this.formName = '';
    this.formBudgetYear = new Date().getFullYear();
    this.formAmountEngaged = 0;
  }

  confirmDelete(s: SupplierBudgetSummary): void {
    this.deleteTarget = s;
  }

  async doDelete(): Promise<void> {
    if (!this.deleteTarget) return;
    try {
      await this.financeService.deleteSupplier(this.deleteTarget.ID);
      this.toast.success('Fournisseur supprimé');
      this.deleteTarget = null;
      await this.loadSuppliers();
    } catch (err) {
      this.toast.error('Erreur: ' + err);
    }
  }

  // ── Expenses Modal ──

  async showExpenses(s: SupplierBudgetSummary): Promise<void> {
    this.expenseSupplier = s;
    this.expenseList = [];
    this.newExpenseDesc = '';
    this.newExpenseAmount = 0;
    this.newExpenseDate = new Date().toISOString().slice(0, 10);
    this.expensesLoading = true;
    try {
      this.expenseList = await this.financeService.getSupplierExpenses(s.ID);
    } catch (err) {
      this.toast.error('Erreur chargement dépenses: ' + err);
    } finally {
      this.expensesLoading = false;
    }
  }

  closeExpenses(): void {
    this.expenseSupplier = null;
    this.expenseList = [];
  }

  async addExpense(): Promise<void> {
    if (!this.expenseSupplier) return;
    const desc = this.newExpenseDesc.trim();
    if (!desc) {
      this.toast.error('Veuillez saisir une description');
      return;
    }
    if (this.newExpenseAmount <= 0) {
      this.toast.error('Veuillez saisir un montant valide');
      return;
    }
    if (!this.newExpenseDate) {
      this.toast.error('Veuillez saisir une date');
      return;
    }
    try {
      await this.financeService.addSupplierExpense(
        this.expenseSupplier.ID,
        this.newExpenseAmount,
        desc,
        this.newExpenseDate,
      );
      this.toast.success('Dépense ajoutée');
      // Reload expenses and refresh parent list
      this.expenseList = await this.financeService.getSupplierExpenses(this.expenseSupplier.ID);
      await this.loadSuppliers();
      // Reset expense form
      this.newExpenseDesc = '';
      this.newExpenseAmount = 0;
      this.newExpenseDate = new Date().toISOString().slice(0, 10);
      // Update the supplier object in modal header
      const updated = this.suppliers.find(s => s.ID === this.expenseSupplier!.ID);
      if (updated) {
        this.expenseSupplier = { ...updated };
      }
    } catch (err) {
      this.toast.error('Erreur: ' + err);
    }
  }

  async deleteExpense(e: SupplierExpense): Promise<void> {
    try {
      await this.financeService.deleteSupplierExpense(e.ID);
      this.toast.success('Dépense supprimée');
      if (this.expenseSupplier) {
        this.expenseList = await this.financeService.getSupplierExpenses(this.expenseSupplier.ID);
        await this.loadSuppliers();
        const updated = this.suppliers.find(s => s.ID === this.expenseSupplier!.ID);
        if (updated) {
          this.expenseSupplier = { ...updated };
        }
      }
    } catch (err) {
      this.toast.error('Erreur: ' + err);
    }
  }
}
