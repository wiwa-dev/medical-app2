# Plan: Génération de Décharge PDF pour les Dépenses

## Objectif
Permettre à l'utilisateur de générer un document de décharge (reçu) en PDF pour chaque ligne de dépense ("autre dépense") dans la page de saisie journalière, en suivant le modèle [`DECHARGE MELVYN 1.docx`](DECHARGE%20MELVYN%201.docx).

## Aperçu du Template
Le fichier [`DECHARGE MELVYN 1.docx`](DECHARGE%20MELVYN%201.docx) contient :
```
DECHARGE

Je soussigné, [Bénéficiaire] déclare avoir reçu la somme de [Montant] 
([Montant en lettres] francs CFA) pour [Description/Motif].

Dakar, [Date]
CIN: [Numéro CIN]
```

## Architecture
Même approche que [`ExportDailyPDF`](app.go:927) — Backend Go avec gofpdf → Wails Bindings → Angular Service → Component.

### Flux de données
```
[Expense Row] → Clic "Décharge" → [Modal: Bénéficiaire, CIN] → 
FinanceService.generateDecharge() → App.GenerateDecharge() (Go) → 
gofpdf génère PDF → retourne filePath → OpenDoc() pour afficher
```

---

## Étapes d'implémentation

### TASK 1: Backend — Helper `numberToWords` en français (Go)

**Fichier** : [`app.go`](app.go)

Ajouter une fonction utilitaire pour convertir un montant en toutes lettres en français :

```go
func numberToWords(amount int) string {
    // Gère les nombres de 0 à 999 999 999
    // Ex: 250000 → "deux cent cinquante mille"
    // Réutilisable pour ExportDailyPDF aussi
}
```

**Logique** : 
- Tableaux pour les unités (un, deux, trois...), dizaines (dix, vingt, trente...), centaines
- Gestion spéciale des règles françaises (ex: 80 → quatre-vingts, 71 → soixante et onze)
- Découpage par millions, milliers, centaines

---

### TASK 2: Backend — Méthode `GenerateDecharge`

**Fichier** : [`app.go`](app.go)

Ajouter une nouvelle méthode publique sur `*App` :

```go
func (a *App) GenerateDecharge(date string, description string, amount float64, 
    beneficiaryName string, cin string) (string, error)
```

**Logique de génération PDF** (avec gofpdf) :

```
+------------------------------------------+
|           DECHARGE                        |
|                                          |
| Je soussigné, [beneficiaryName] déclare  |
| avoir reçu la somme de [amount] FCFA     |
| ([amountInWords] francs CFA) pour        |
| [description].                           |
|                                          |
|                                          |
| Dakar, le [date]                         |
| CIN: [cin]                               |
|                                          |
| Signature: __________                    |
+------------------------------------------+
```

- Généré dans le même répertoire que les PDFs existants (ex: `exports/`)
- Nom de fichier: `decharge_YYYY-MM-DD_HHMMSS.pdf`
- Police: utilise la même police que [`ExportDailyPDF`](app.go:927) (gofpdf standard ou Arial Unicode)
- Montant en toutes lettres via `numberToWords()`

---

### TASK 3: Frontend — Wails Bindings (auto-généré)

**Fichiers** : 
- [`frontend/wailsjs/go/main/App.d.ts`](frontend/wailsjs/go/main/App.d.ts)
- [`frontend/wailsjs/go/main/App.js`](frontend/wailsjs/go/main/App.js)

Ces fichiers sont **auto-générés** par Wails lors du build. Le binding `GenerateDecharge` apparaîtra automatiquement après régénération.

---

### TASK 4: Frontend — FinanceService

**Fichier** : [`frontend/src/app/core/services/finance.service.ts`](frontend/src/app/core/services/finance.service.ts)

Ajouter :
1. **Import** : `GenerateDecharge` (depuis Wails bindings)
2. **Méthode** :

```typescript
generateDecharge(date: string, description: string, amount: number, 
    beneficiaryName: string, cin: string): Promise<string> {
    return GenerateDecharge(date, description, amount, beneficiaryName, cin);
}
```

---

### TASK 5: Frontend — SaisieJourComponent (Template)

**Fichier** : [`frontend/src/app/pages/saisie-jour/saisie-jour.component.ts`](frontend/src/app/pages/saisie-jour/saisie-jour.component.ts)

**5a. Ajouter le bouton "Décharge" sur chaque ligne de dépense**

Dans le template [`saisie-jour.component.ts:162-175`](frontend/src/app/pages/saisie-jour/saisie-jour.component.ts:162), modifier la ligne de dépense pour ajouter un bouton "Décharge" à côté du bouton delete :

```html
@for (exp of expenses; track $index) {
  <div class="flex gap-2 items-center">
    <input type="text" [(ngModel)]="exp.description" ... />
    <input type="number" [(ngModel)]="exp.amount" ... />
    <button type="button" (click)="openDechargeModal($index)"
            class="p-2 text-tertiary hover:bg-tertiary-container/20 rounded-lg transition-colors"
            title="Générer une décharge">
      <span class="material-symbols-outlined" style="font-size: 18px;">description</span>
    </button>
    @if (expenses.length > 1) {
      <button type="button" (click)="removeExpense($index)" ...>
        <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
      </button>
    }
  </div>
}
```

Icône : `description` (document) ou `receipt` — pour représenter la décharge.

**5b. Ajouter le Modal de Décharge**

Suivre le même pattern que [`gestion-fournisseurs.component.ts:171-265`](frontend/src/app/pages/gestion-fournisseurs/gestion-fournisseurs.component.ts:171) (modal overlay) :

```html
<!-- Décharge Modal -->
@if (dechargeTarget !== null) {
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" 
       (click)="closeDechargeModal()">
    <div class="bg-surface rounded-xl shadow-xl max-w-md w-full mx-4 p-6" 
         (click)="$event.stopPropagation()">
      
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2">
          <span class="material-symbols-outlined text-tertiary" style="font-size: 20px;">description</span>
          Générer une décharge
        </h3>
        <button (click)="closeDechargeModal()" 
                class="p-2 text-on-surface-variant hover:text-error rounded-lg transition-colors">
          <span class="material-symbols-outlined" style="font-size: 20px;">close</span>
        </button>
      </div>

      <!-- Form -->
      <div class="space-y-4">
        <!-- Description (pre-filled, readonly) -->
        <div>
          <label class="font-label-caps text-label-caps text-on-surface-variant block mb-1">Motif</label>
          <input type="text" [value]="dechargeDescription" readonly
                 class="w-full border border-outline-variant rounded-lg px-3 py-2 font-body-md 
                        bg-surface-container-low text-on-surface-variant cursor-not-allowed" />
        </div>
        
        <!-- Montant (pre-filled, readonly) -->
        <div>
          <label class="font-label-caps text-label-caps text-on-surface-variant block mb-1">Montant (FCFA)</label>
          <input type="number" [value]="dechargeAmount" readonly
                 class="w-full border border-outline-variant rounded-lg px-3 py-2 font-data-tabular 
                        bg-surface-container-low text-on-surface-variant cursor-not-allowed" />
        </div>
        
        <!-- Bénéficiaire -->
        <div>
          <label class="font-label-caps text-label-caps text-on-surface-variant block mb-1">
            Nom du bénéficiaire <span class="text-error">*</span>
          </label>
          <input type="text" [(ngModel)]="dechargeBeneficiary" 
                 placeholder="Ex: Seydina Issa FAYE"
                 class="w-full border border-outline-variant rounded-lg px-3 py-2 font-body-md 
                        bg-surface-container-lowest focus:border-primary focus:outline-none" />
        </div>
        
        <!-- N° CIN -->
        <div>
          <label class="font-label-caps text-label-caps text-on-surface-variant block mb-1">
            N° CIN / Pièce d'identité <span class="text-error">*</span>
          </label>
          <input type="text" [(ngModel)]="dechargeCin" 
                 placeholder="Ex: 1758199600047"
                 class="w-full border border-outline-variant rounded-lg px-3 py-2 font-body-md 
                        bg-surface-container-lowest focus:border-primary focus:outline-none" />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3 mt-6">
        <button (click)="closeDechargeModal()"
                class="px-4 py-2 border border-outline-variant text-on-surface rounded-lg 
                       font-label-caps text-label-caps uppercase hover:bg-surface-container-low transition-colors">
          Annuler
        </button>
        <button (click)="generateDecharge()" [disabled]="dechargeGenerating"
                class="px-4 py-2 bg-tertiary text-on-tertiary rounded-lg font-label-caps text-label-caps 
                       uppercase hover:bg-tertiary/90 transition-colors shadow-sm disabled:opacity-60
                       flex items-center gap-2">
          @if (dechargeGenerating) {
            <span class="material-symbols-outlined animate-spin" style="font-size: 16px;">progress_activity</span>
          }
          {{ dechargeGenerating ? 'Génération...' : 'Générer le PDF' }}
        </button>
      </div>
    </div>
  </div>
}
```

---

### TASK 6: Frontend — SaisieJourComponent (Classe TypeScript)

**Fichier** : [`frontend/src/app/pages/saisie-jour/saisie-jour.component.ts`](frontend/src/app/pages/saisie-jour/saisie-jour.component.ts)

**6a. Ajouter les propriétés d'état** (vers [`saisie-jour.component.ts:286-298`](frontend/src/app/pages/saisie-jour/saisie-jour.component.ts:286)) :

```typescript
// Décharge modal state
dechargeTarget: number | null = null;  // index de la dépense
dechargeDescription = '';
dechargeAmount = 0;
dechargeBeneficiary = '';
dechargeCin = '';
dechargeGenerating = false;
```

**6b. Ajouter les méthodes** :

```typescript
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
        this.toast.error('Veuillez saisir le nom du bénéficiaire');
        return;
    }
    if (!this.dechargeCin.trim()) {
        this.toast.error('Veuillez saisir le numéro CIN');
        return;
    }
    if (this.dechargeAmount <= 0) {
        this.toast.error('Le montant doit être supérieur à 0');
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
        this.toast.success('Décharge générée avec succès');
        this.closeDechargeModal();
        await this.financeService.openDoc(filePath);
    } catch (err) {
        this.toast.error('Erreur lors de la génération: ' + err);
    } finally {
        this.dechargeGenerating = false;
    }
}
```

---

## Diagramme de Flux

```mermaid
sequenceDiagram
    participant User as Utilisateur
    component ExpenseRow as Ligne de Dépense
    component Modal as Modal Décharge
    component Service as FinanceService
    component Go as App (Go Backend)
    component PDF as Fichier PDF
    
    User->>ExpenseRow: Clic bouton "Décharge"
    ExpenseRow->>Modal: openDechargeModal(index)
    Modal->>User: Affiche formulaire (description, montant pré-remplis)
    User->>Modal: Saisit bénéficiaire + CIN
    User->>Modal: Clic "Générer le PDF"
    Modal->>Service: generateDecharge(date, desc, amount, beneficiary, cin)
    Service->>Go: GenerateDecharge()
    Go->>Go: numberToWords(amount)
    Go->>Go: gofpdf génère PDF
    Go->>PDF: Sauvegarde fichier
    Go->>Service: Retourne filePath
    Service->>Modal: Retourne filePath
    Modal->>Modal: closeDechargeModal()
    Modal->>Service: openDoc(filePath)
    Service->>Go: OpenDoc()
    Go->>PDF: Ouvre le fichier
```

---

## Résumé des Modifications

| Fichier | Type de Modification | Description |
|---------|---------------------|-------------|
| [`app.go`](app.go) | Ajout | Fonction `numberToWords()` + méthode `GenerateDecharge()` |
| [`frontend/wailsjs/go/main/App.d.ts`](frontend/wailsjs/go/main/App.d.ts) | Auto-généré | Binding TypeScript pour `GenerateDecharge` |
| [`frontend/wailsjs/go/main/App.js`](frontend/wailsjs/go/main/App.js) | Auto-généré | Binding JS pour `GenerateDecharge` |
| [`frontend/src/app/core/services/finance.service.ts`](frontend/src/app/core/services/finance.service.ts) | Ajout | Import `GenerateDecharge` + méthode `generateDecharge()` |
| [`frontend/src/app/pages/saisie-jour/saisie-jour.component.ts`](frontend/src/app/pages/saisie-jour/saisie-jour.component.ts) | Modification | Bouton "Décharge" + Modal + Propriétés d'état + Méthodes |

## Ordre d'Exécution

1. **TASK 1** — Ajouter `numberToWords()` dans [`app.go`](app.go)
2. **TASK 2** — Ajouter `GenerateDecharge()` dans [`app.go`](app.go)
3. **TASK 3** — Régénérer les bindings Wails (via `wails generate module` ou build)
4. **TASK 4** — Ajouter `generateDecharge()` dans [`finance.service.ts`](frontend/src/app/core/services/finance.service.ts)
5. **TASK 5** — Modifier le template de [`saisie-jour.component.ts`](frontend/src/app/pages/saisie-jour/saisie-jour.component.ts) (bouton + modal)
6. **TASK 6** — Ajouter les propriétés et méthodes dans la classe [`saisie-jour.component.ts`](frontend/src/app/pages/saisie-jour/saisie-jour.component.ts)
