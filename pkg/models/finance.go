package models

import "gorm.io/gorm"

// DailyEntry stores daily receipts per service
type DailyEntry struct {
	gorm.Model
	Date          string  `json:"Date" gorm:"uniqueIndex"`
	Analyses      float64 `json:"Analyses"`
	GSRH          float64 `json:"GSRH"`
	ECG           float64 `json:"ECG"`
	Ecocoeur      float64 `json:"Ecocoeur"`
	HolterECG     float64 `json:"HolterECG"`
	MAPA          float64 `json:"MAPA"`
	Dentiste      float64 `json:"Dentiste"`
	Ophtalmologie float64 `json:"Ophtalmologie"`
	Imagerie      float64 `json:"Imagerie"`
	Cardiologie   float64 `json:"Cardiologie"`
	Status        string  `json:"Status"` // "draft" | "validated"
}

// DailyExpense stores a single expense line for a given day
type DailyExpense struct {
	gorm.Model
	Date        string  `json:"Date"`
	Description string  `json:"Description"`
	Amount      float64 `json:"Amount"`
}

// MonthlyHonoraire stores staff honoraria for a given month/year
type MonthlyHonoraire struct {
	gorm.Model
	Month      int     `json:"Month"`
	Year       int     `json:"Year"`
	PersonName string  `json:"PersonName"`
	Role       string  `json:"Role"`
	Amount     float64 `json:"Amount"`
}

// Investment stores investments for a given month/year
type Investment struct {
	gorm.Model
	Month       int     `json:"Month"`
	Year        int     `json:"Year"`
	Description string  `json:"Description"`
	Amount      float64 `json:"Amount"`
}

// YearSettings stores per-year configuration (initial balance)
type YearSettings struct {
	gorm.Model
	Year           int     `json:"Year" gorm:"uniqueIndex"`
	InitialBalance float64 `json:"InitialBalance"`
}

// ---- Response / DTO types ----

type DailyEntryWithExpenses struct {
	Entry    DailyEntry    `json:"Entry"`
	Expenses []DailyExpense `json:"Expenses"`
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
	Month              int                `json:"Month"`
	Year               int                `json:"Year"`
	WeekCount          int                `json:"WeekCount"`
	Services           []ServiceWeekData  `json:"Services"`
	WeekTotals         []float64          `json:"WeekTotals"`
	TotalReceipts      float64            `json:"TotalReceipts"`
	Honoraires         []MonthlyHonoraire `json:"Honoraires"`
	TotalHonoraires    float64            `json:"TotalHonoraires"`
	OtherExpensesTotal float64            `json:"OtherExpensesTotal"`
	Investments        []Investment       `json:"Investments"`
	TotalInvestments   float64            `json:"TotalInvestments"`
	TotalExpenses      float64            `json:"TotalExpenses"`
	PreviousBalance    float64            `json:"PreviousBalance"`
	Profit             float64            `json:"Profit"`
	FinalBalance       float64            `json:"FinalBalance"`
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
