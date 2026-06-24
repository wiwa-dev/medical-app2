package models

import "gorm.io/gorm"

// MedicalService defines an available service in the clinic.
// This is the catalogue; add/remove services here.
type MedicalService struct {
	gorm.Model
	Name       string `json:"Name" gorm:"uniqueIndex"`
	Label      string `json:"Label"`
	ShortLabel string `json:"ShortLabel"`
	SortOrder  int    `json:"SortOrder"`
	Active     bool   `json:"Active" gorm:"default:true"`
}

// DailyServiceValue stores the amount for one service on one date (EAV).
// Using ServiceName (not FK) so historical data survives if a service is deactivated.
type DailyServiceValue struct {
	gorm.Model
	Date        string  `json:"Date" gorm:"uniqueIndex:idx_dsv_date_svc"`
	ServiceName string  `json:"ServiceName" gorm:"uniqueIndex:idx_dsv_date_svc"`
	Amount      float64 `json:"Amount"`
}

// DailyEntry stores only the date and validation status.
// Service amounts are now stored in DailyServiceValue.
// NOTE: old service columns (Analyses, GSRH …) still exist in the SQLite file
// but are no longer mapped here – GORM ignores unmapped columns.
type DailyEntry struct {
	gorm.Model
	Date   string `json:"Date" gorm:"uniqueIndex"`
	Status string `json:"Status"` // "draft" | "validated"
}

// DailyExpense stores a single expense line for a given day.
type DailyExpense struct {
	gorm.Model
	Date        string  `json:"Date"`
	Description string  `json:"Description"`
	Amount      float64 `json:"Amount"`
}

// MonthlyHonoraire stores staff honoraria for a given month/year.
type MonthlyHonoraire struct {
	gorm.Model
	Month      int     `json:"Month"`
	Year       int     `json:"Year"`
	PersonName string  `json:"PersonName"`
	Role       string  `json:"Role"`
	Amount     float64 `json:"Amount"`
}

// Investment stores investments for a given month/year.
type Investment struct {
	gorm.Model
	Month        int     `json:"Month"`
	Year         int     `json:"Year"`
	Description  string  `json:"Description"`
	Amount       float64 `json:"Amount"`
	DocumentPath string  `json:"DocumentPath"`
}

// MonthlyOffre stores offers for a given month/year (informational only, not in financial calculations).
type MonthlyOffre struct {
	gorm.Model
	Month    int     `json:"Month"`
	Year     int     `json:"Year"`
	Category string  `json:"Category"` // "Agent_Etat" or "Non_Ayant_Droit"
	Amount   float64 `json:"Amount"`
}

// YearSettings stores per-year configuration (initial balance).
type YearSettings struct {
	gorm.Model
	Year           int     `json:"Year" gorm:"uniqueIndex"`
	InitialBalance float64 `json:"InitialBalance"`
}

// Supplier stores supplier budget tracking information.
type Supplier struct {
	gorm.Model
	Name          string  `json:"Name"`
	BudgetYear    int     `json:"BudgetYear"`
	AmountEngaged float64 `json:"AmountEngaged"`
}

// SupplierExpense stores expenses recorded against a supplier's budget.
type SupplierExpense struct {
	gorm.Model
	SupplierID  uint    `json:"SupplierID"`
	Amount      float64 `json:"Amount"`
	Description string  `json:"Description"`
	Date        string  `json:"Date"`
}

// SupplierBudgetSummary is a DTO for displaying supplier budget status.
type SupplierBudgetSummary struct {
	ID            uint    `json:"ID"`
	Name          string  `json:"Name"`
	BudgetYear    int     `json:"BudgetYear"`
	AmountEngaged float64 `json:"AmountEngaged"`
	TotalExpenses float64 `json:"TotalExpenses"`
	Remaining     float64 `json:"Remaining"`
}

// ---- Response / DTO types ----

type DailyEntryWithExpenses struct {
	Entry         DailyEntry          `json:"Entry"`
	ServiceValues []DailyServiceValue `json:"ServiceValues"`
	Expenses      []DailyExpense      `json:"Expenses"`
}

type DayHistoryRow struct {
	Date          string  `json:"Date"`
	TotalReceipts float64 `json:"TotalReceipts"`
	TotalExpenses float64 `json:"TotalExpenses"`
	NetBalance    float64 `json:"NetBalance"`
	Status        string  `json:"Status"`
}

type ServiceWeekData struct {
	Service string    `json:"Service"`
	Weeks   []float64 `json:"Weeks"`
	Total   float64   `json:"Total"`
}

type MonthlyReport struct {
	Month                int                `json:"Month"`
	Year                 int                `json:"Year"`
	WeekCount            int                `json:"WeekCount"`
	Services             []ServiceWeekData  `json:"Services"`
	WeekTotals           []float64          `json:"WeekTotals"`
	TotalReceipts        float64            `json:"TotalReceipts"`
	Honoraires           []MonthlyHonoraire `json:"Honoraires"`
	TotalHonoraires      float64            `json:"TotalHonoraires"`
	OtherExpensesTotal   float64            `json:"OtherExpensesTotal"`
	Investments          []Investment       `json:"Investments"`
	TotalInvestments     float64            `json:"TotalInvestments"`
	TotalExpenses        float64            `json:"TotalExpenses"`
	PreviousBalance      float64            `json:"PreviousBalance"`
	Profit               float64            `json:"Profit"`
	FinalBalance         float64            `json:"FinalBalance"`
	OffresAgentEtat      float64            `json:"OffresAgentEtat"`
	OffresNonAyantDroit  float64            `json:"OffresNonAyantDroit"`
	TotalOffres          float64            `json:"TotalOffres"`
}

type MonthSummary struct {
	Month            int     `json:"Month"`
	PreviousBalance  float64 `json:"PreviousBalance"`
	TotalReceipts    float64 `json:"TotalReceipts"`
	TotalHonoraires  float64 `json:"TotalHonoraires"`
	OtherExpenses    float64 `json:"OtherExpenses"`
	TotalInvestments float64 `json:"TotalInvestments"`
	Profit           float64 `json:"Profit"`
	ClosingBalance   float64 `json:"ClosingBalance"`
}

type AnnualReport struct {
	Year             int            `json:"Year"`
	InitialBalance   float64        `json:"InitialBalance"`
	Months           []MonthSummary `json:"Months"`
	TotalReceipts    float64        `json:"TotalReceipts"`
	TotalHonoraires  float64        `json:"TotalHonoraires"`
	TotalOtherExp    float64        `json:"TotalOtherExp"`
	TotalInvestments float64        `json:"TotalInvestments"`
	TotalProfit      float64        `json:"TotalProfit"`
	ClosingBalance   float64        `json:"ClosingBalance"`
}
