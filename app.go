package main

import (
	"context"
	"errors"
	"fmt"
	"medical-app/pkg/config"
	"medical-app/pkg/db/sqlite"
	"medical-app/pkg/models"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"

	run "github.com/wailsapp/wails/v2/pkg/runtime"
	"github.com/xuri/excelize/v2"
	"golang.org/x/crypto/bcrypt"
)

var currentUser *models.User

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App struct.
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// OpenDoc opens a file with the default OS application.
func (a *App) OpenDoc(filePath string) error {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", "", filePath)
	case "darwin":
		cmd = exec.Command("open", filePath)
	default:
		cmd = exec.Command("xdg-open", filePath)
	}
	return cmd.Start()
}

// SelectFile opens a file picker dialog and returns the selected path.
func (a *App) SelectFile(title string) (string, error) {
	filePath, err := run.OpenFileDialog(a.ctx, run.OpenDialogOptions{
		Title: title,
	})
	if err != nil || filePath == "" {
		return "", err
	}
	return filePath, nil
}

// ============================================================
// AUTH
// ============================================================

func (a *App) Login(email, password string) (*models.User, error) {
	var user models.User
	db := sqlite.GlobalDB.GetDB()
	if err := db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, errors.New("utilisateur non trouvé")
	}
	if !CheckPassword(password, user.Password) {
		return nil, errors.New("mot de passe incorrect")
	}
	currentUser = &user
	return &user, nil
}

func (a *App) Logout() {
	currentUser = nil
}

func (a *App) GetCurrentUser() *models.User {
	return currentUser
}

func (a *App) CreateUser(user models.User) (int64, error) {
	db := sqlite.GlobalDB.GetDB()
	if err := RequireAdmin(); err != nil {
		return 0, err
	}
	user.IsAdmin = false
	user.Password = HashPassword(user.Password)

	var existing models.User
	if db.Where("email = ?", user.Email).First(&existing).Error == nil {
		result := db.Model(&existing).Updates(models.User{
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Password:  user.Password,
		})
		return result.RowsAffected, result.Error
	}
	result := db.Create(&user)
	return result.RowsAffected, result.Error
}

func (a *App) UpdateAdminProfile(user models.User) (*models.User, error) {
	db := sqlite.GlobalDB.GetDB()
	if err := RequireAdmin(); err != nil {
		return nil, err
	}
	result := db.Model(&models.User{}).Where("id = ?", user.ID).Updates(map[string]interface{}{
		"first_name": user.FirstName,
		"last_name":  user.LastName,
		"email":      user.Email,
	})
	if result.Error != nil {
		return nil, result.Error
	}
	if currentUser != nil && currentUser.ID == user.ID {
		currentUser.FirstName = user.FirstName
		currentUser.LastName = user.LastName
		currentUser.Email = user.Email
	}
	return currentUser, nil
}

func (a *App) UpdatePassword(userID uint, newPassword string) error {
	db := sqlite.GlobalDB.GetDB()
	if err := RequireAdmin(); err != nil {
		return err
	}
	hashed := HashPassword(newPassword)
	return db.Model(&models.User{}).Where("id = ?", userID).Update("password", hashed).Error
}

func RequireAuth() (*models.User, error) {
	if currentUser == nil {
		return nil, errors.New("non authentifié")
	}
	return currentUser, nil
}

func RequireAdmin() error {
	if currentUser == nil || !currentUser.IsAdmin {
		return errors.New("accès réservé à l'administrateur")
	}
	return nil
}

func CheckPassword(p, hash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(p)) == nil
}

func HashPassword(p string) string {
	hash, _ := bcrypt.GenerateFromPassword([]byte(p), bcrypt.DefaultCost)
	return string(hash)
}

func SeedAdmin() {
	var count int64
	db := sqlite.GlobalDB.GetDB()
	db.Model(&models.User{}).Count(&count)
	if count == 0 {
		admin := models.User{
			FirstName: "Administrateur",
			LastName:  "CMSFP",
			Email:     "admin@cmsfp.sn",
			Password:  HashPassword("Admin@2025"),
			IsAdmin:   true,
		}
		db.Create(&admin)
	}
}

// ============================================================
// SAISIE JOURNALIÈRE
// ============================================================

// GetDailyEntry returns the entry + expenses for a given date ("2025-01-15").
func (a *App) GetDailyEntry(date string) (models.DailyEntryWithExpenses, error) {
	db := sqlite.GlobalDB.GetDB()

	var entry models.DailyEntry
	db.Where("date = ?", date).First(&entry)

	var expenses []models.DailyExpense
	db.Where("date = ?", date).Order("id").Find(&expenses)

	return models.DailyEntryWithExpenses{Entry: entry, Expenses: expenses}, nil
}

// SaveDailyEntry saves (upsert) an entry + expenses for a given date.
func (a *App) SaveDailyEntry(date string, entry models.DailyEntry, expenses []models.DailyExpense) error {
	db := sqlite.GlobalDB.GetDB()

	entry.Date = date
	entry.Status = "validated"

	var existing models.DailyEntry
	if db.Where("date = ?", date).First(&existing).Error == nil {
		entry.ID = existing.ID
		entry.CreatedAt = existing.CreatedAt
		if err := db.Save(&entry).Error; err != nil {
			return err
		}
	} else {
		if err := db.Create(&entry).Error; err != nil {
			return err
		}
	}

	// Replace expenses for this date
	db.Where("date = ?", date).Delete(&models.DailyExpense{})
	for i := range expenses {
		expenses[i].ID = 0
		expenses[i].Date = date
		if expenses[i].Amount > 0 || expenses[i].Description != "" {
			if err := db.Create(&expenses[i]).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

// GetWeekHistory returns history rows for the calendar week containing the given date.
func (a *App) GetWeekHistory(date string) ([]models.DayHistoryRow, error) {
	db := sqlite.GlobalDB.GetDB()

	t, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, fmt.Errorf("date invalide: %w", err)
	}

	monday, sunday := weekBounds(t)
	mondayStr := monday.Format("2006-01-02")
	sundayStr := sunday.Format("2006-01-02")

	var entries []models.DailyEntry
	db.Where("date BETWEEN ? AND ?", mondayStr, sundayStr).Order("date").Find(&entries)

	var rawExpenses []models.DailyExpense
	db.Where("date BETWEEN ? AND ?", mondayStr, sundayStr).Find(&rawExpenses)

	expByDate := make(map[string]float64)
	for _, e := range rawExpenses {
		expByDate[e.Date] += e.Amount
	}

	result := make([]models.DayHistoryRow, 0, len(entries))
	for _, e := range entries {
		totalR := entryReceipts(e)
		totalE := expByDate[e.Date]
		result = append(result, models.DayHistoryRow{
			Date:          e.Date,
			TotalReceipts: totalR,
			TotalExpenses: totalE,
			NetBalance:    totalR - totalE,
			Status:        e.Status,
		})
	}
	return result, nil
}

// ============================================================
// RAPPORT MENSUEL
// ============================================================

// GetMonthlyReport returns the full aggregated monthly report.
func (a *App) GetMonthlyReport(month, year int) (models.MonthlyReport, error) {
	db := sqlite.GlobalDB.GetDB()

	firstDay := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	lastDay := firstDay.AddDate(0, 1, -1)
	firstStr := firstDay.Format("2006-01-02")
	lastStr := lastDay.Format("2006-01-02")

	var entries []models.DailyEntry
	db.Where("date BETWEEN ? AND ?", firstStr, lastStr).Order("date").Find(&entries)

	// Determine week count
	maxWeekIdx := 0
	for _, e := range entries {
		t, _ := time.Parse("2006-01-02", e.Date)
		idx := weekIndexInMonth(t)
		if idx > maxWeekIdx {
			maxWeekIdx = idx
		}
	}
	weekCount := maxWeekIdx + 1
	if weekCount < 4 {
		weekCount = 4
	}

	// Service names and extraction functions
	type svcFn struct {
		name string
		get  func(models.DailyEntry) float64
	}
	serviceList := []svcFn{
		{"Analyses biologiques", func(e models.DailyEntry) float64 { return e.Analyses }},
		{"GSRH", func(e models.DailyEntry) float64 { return e.GSRH }},
		{"ECG", func(e models.DailyEntry) float64 { return e.ECG }},
		{"Échocœur", func(e models.DailyEntry) float64 { return e.Ecocoeur }},
		{"Holter ECG", func(e models.DailyEntry) float64 { return e.HolterECG }},
		{"MAPA", func(e models.DailyEntry) float64 { return e.MAPA }},
		{"Dentiste", func(e models.DailyEntry) float64 { return e.Dentiste }},
		{"Ophtalmologie", func(e models.DailyEntry) float64 { return e.Ophtalmologie }},
		{"Imagerie médicale", func(e models.DailyEntry) float64 { return e.Imagerie }},
		{"Cardiologie", func(e models.DailyEntry) float64 { return e.Cardiologie }},
	}

	weekTotals := make([]float64, weekCount)
	var serviceData []models.ServiceWeekData

	for _, svc := range serviceList {
		weeks := make([]float64, weekCount)
		total := 0.0
		for _, e := range entries {
			t, _ := time.Parse("2006-01-02", e.Date)
			idx := weekIndexInMonth(t)
			if idx < weekCount {
				weeks[idx] += svc.get(e)
				total += svc.get(e)
			}
		}
		if total > 0 {
			serviceData = append(serviceData, models.ServiceWeekData{
				Service: svc.name,
				Weeks:   weeks,
				Total:   total,
			})
		}
	}

	totalReceipts := 0.0
	for _, e := range entries {
		totalReceipts += entryReceipts(e)
	}
	for i := range weekTotals {
		for _, sd := range serviceData {
			if i < len(sd.Weeks) {
				weekTotals[i] += sd.Weeks[i]
			}
		}
	}

	// Honoraires
	var honoraires []models.MonthlyHonoraire
	db.Where("month = ? AND year = ?", month, year).Find(&honoraires)
	totalHonoraires := 0.0
	for _, h := range honoraires {
		totalHonoraires += h.Amount
	}

	// Other expenses (daily)
	var rawExpenses []models.DailyExpense
	db.Where("date BETWEEN ? AND ?", firstStr, lastStr).Find(&rawExpenses)
	otherExpTotal := 0.0
	for _, e := range rawExpenses {
		otherExpTotal += e.Amount
	}

	// Investments
	var investments []models.Investment
	db.Where("month = ? AND year = ?", month, year).Find(&investments)
	totalInvestments := 0.0
	for _, inv := range investments {
		totalInvestments += inv.Amount
	}

	totalExpenses := totalHonoraires + otherExpTotal + totalInvestments
	profit := totalReceipts - totalHonoraires - otherExpTotal
	prevBalance := a.computeBalanceUpTo(month, year)
	finalBalance := prevBalance + profit - totalInvestments

	return models.MonthlyReport{
		Month:              month,
		Year:               year,
		WeekCount:          weekCount,
		Services:           serviceData,
		WeekTotals:         weekTotals,
		TotalReceipts:      totalReceipts,
		Honoraires:         honoraires,
		TotalHonoraires:    totalHonoraires,
		OtherExpensesTotal: otherExpTotal,
		Investments:        investments,
		TotalInvestments:   totalInvestments,
		TotalExpenses:      totalExpenses,
		PreviousBalance:    prevBalance,
		Profit:             profit,
		FinalBalance:       finalBalance,
	}, nil
}

// SaveMonthlyHonoraires replaces honoraires for a month/year.
func (a *App) SaveMonthlyHonoraires(month, year int, honoraires []models.MonthlyHonoraire) error {
	db := sqlite.GlobalDB.GetDB()
	db.Where("month = ? AND year = ?", month, year).Delete(&models.MonthlyHonoraire{})
	for i := range honoraires {
		honoraires[i].ID = 0
		honoraires[i].Month = month
		honoraires[i].Year = year
		if err := db.Create(&honoraires[i]).Error; err != nil {
			return err
		}
	}
	return nil
}

// GetMonthlyHonoraires retrieves honoraires for a month/year.
func (a *App) GetMonthlyHonoraires(month, year int) ([]models.MonthlyHonoraire, error) {
	db := sqlite.GlobalDB.GetDB()
	var honoraires []models.MonthlyHonoraire
	db.Where("month = ? AND year = ?", month, year).Find(&honoraires)
	return honoraires, nil
}

// SaveInvestments replaces investments for a month/year.
func (a *App) SaveInvestments(month, year int, investments []models.Investment) error {
	db := sqlite.GlobalDB.GetDB()
	db.Where("month = ? AND year = ?", month, year).Delete(&models.Investment{})
	for i := range investments {
		investments[i].ID = 0
		investments[i].Month = month
		investments[i].Year = year
		if err := db.Create(&investments[i]).Error; err != nil {
			return err
		}
	}
	return nil
}

// GetInvestments retrieves investments for a month/year.
func (a *App) GetInvestments(month, year int) ([]models.Investment, error) {
	db := sqlite.GlobalDB.GetDB()
	var investments []models.Investment
	db.Where("month = ? AND year = ?", month, year).Find(&investments)
	return investments, nil
}

// ============================================================
// BILAN ANNUEL
// ============================================================

// GetAnnualReport computes the full annual summary.
func (a *App) GetAnnualReport(year int) (models.AnnualReport, error) {
	db := sqlite.GlobalDB.GetDB()

	var yearSettings models.YearSettings
	db.Where("year = ?", year).First(&yearSettings)

	balance := yearSettings.InitialBalance
	var months []models.MonthSummary

	totalReceipts := 0.0
	totalHonoraires := 0.0
	totalOtherExp := 0.0
	totalInvestments := 0.0

	for m := 1; m <= 12; m++ {
		firstDay := time.Date(year, time.Month(m), 1, 0, 0, 0, 0, time.UTC)
		lastDay := firstDay.AddDate(0, 1, -1)
		firstStr := firstDay.Format("2006-01-02")
		lastStr := lastDay.Format("2006-01-02")

		var entries []models.DailyEntry
		db.Where("date BETWEEN ? AND ?", firstStr, lastStr).Find(&entries)
		receipts := 0.0
		for _, e := range entries {
			receipts += entryReceipts(e)
		}

		var honoraires []models.MonthlyHonoraire
		db.Where("month = ? AND year = ?", m, year).Find(&honoraires)
		honorTotal := 0.0
		for _, h := range honoraires {
			honorTotal += h.Amount
		}

		var expenses []models.DailyExpense
		db.Where("date BETWEEN ? AND ?", firstStr, lastStr).Find(&expenses)
		otherExp := 0.0
		for _, e := range expenses {
			otherExp += e.Amount
		}

		var investments []models.Investment
		db.Where("month = ? AND year = ?", m, year).Find(&investments)
		invTotal := 0.0
		for _, inv := range investments {
			invTotal += inv.Amount
		}

		profit := receipts - honorTotal - otherExp
		closingBalance := balance + profit - invTotal

		months = append(months, models.MonthSummary{
			Month:            m,
			PreviousBalance:  balance,
			TotalReceipts:    receipts,
			TotalHonoraires:  honorTotal,
			OtherExpenses:    otherExp,
			TotalInvestments: invTotal,
			Profit:           profit,
			ClosingBalance:   closingBalance,
		})

		totalReceipts += receipts
		totalHonoraires += honorTotal
		totalOtherExp += otherExp
		totalInvestments += invTotal
		balance = closingBalance
	}

	return models.AnnualReport{
		Year:             year,
		InitialBalance:   yearSettings.InitialBalance,
		Months:           months,
		TotalReceipts:    totalReceipts,
		TotalHonoraires:  totalHonoraires,
		TotalOtherExp:    totalOtherExp,
		TotalInvestments: totalInvestments,
		TotalProfit:      totalReceipts - totalHonoraires - totalOtherExp,
		ClosingBalance:   balance,
	}, nil
}

// ExportAnnualExcel exports the annual report to an .xlsx file and returns its path.
func (a *App) ExportAnnualExcel(year int) (string, error) {
	report, err := a.GetAnnualReport(year)
	if err != nil {
		return "", err
	}

	f := excelize.NewFile()
	sheet := fmt.Sprintf("Bilan %d", year)
	f.SetSheetName("Sheet1", sheet)

	monthNames := []string{
		"Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
		"Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
	}

	headers := []string{
		"Mois", "Solde Précédent (FCFA)", "Recettes Totales (FCFA)",
		"Honoraires Personnel (FCFA)", "Autres Dépenses (FCFA)",
		"Investissements (FCFA)", "Bénéfice (FCFA)", "Solde de Clôture (FCFA)",
	}

	// Write headers
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}

	// Style for header
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "#FFFFFF", Size: 11},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#002045"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})
	lastHeaderCell, _ := excelize.CoordinatesToCellName(len(headers), 1)
	f.SetCellStyle(sheet, "A1", lastHeaderCell, headerStyle)

	// Write month rows
	for i, ms := range report.Months {
		row := i + 2
		data := []interface{}{
			monthNames[ms.Month-1],
			ms.PreviousBalance,
			ms.TotalReceipts,
			ms.TotalHonoraires,
			ms.OtherExpenses,
			ms.TotalInvestments,
			ms.Profit,
			ms.ClosingBalance,
		}
		for j, val := range data {
			cell, _ := excelize.CoordinatesToCellName(j+1, row)
			f.SetCellValue(sheet, cell, val)
		}
	}

	// Total row
	totalRow := 14
	totalData := []interface{}{
		"TOTAL ANNUEL", "-",
		report.TotalReceipts, report.TotalHonoraires,
		report.TotalOtherExp, report.TotalInvestments,
		report.TotalProfit, report.ClosingBalance,
	}
	for j, val := range totalData {
		cell, _ := excelize.CoordinatesToCellName(j+1, totalRow)
		f.SetCellValue(sheet, cell, val)
	}

	// Style totals row
	totalStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 11},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#E5EEFF"}, Pattern: 1},
	})
	lastTotalCell, _ := excelize.CoordinatesToCellName(len(headers), totalRow)
	totalRowCell, _ := excelize.CoordinatesToCellName(1, totalRow)
	f.SetCellStyle(sheet, totalRowCell, lastTotalCell, totalStyle)

	// Auto-width
	for i := 1; i <= len(headers); i++ {
		col, _ := excelize.ColumnNumberToName(i)
		f.SetColWidth(sheet, col, col, 24)
	}

	// Save file
	dir := config.GetExportsDir()
	filePath := filepath.Join(dir, fmt.Sprintf("bilan_annuel_%d_%d.xlsx", year, time.Now().Unix()))
	if err := f.SaveAs(filePath); err != nil {
		return "", err
	}
	return filePath, nil
}

// ============================================================
// YEAR SETTINGS
// ============================================================

// GetYearSettings returns settings (initial balance) for a year.
func (a *App) GetYearSettings(year int) (models.YearSettings, error) {
	db := sqlite.GlobalDB.GetDB()
	var s models.YearSettings
	db.Where("year = ?", year).First(&s)
	if s.Year == 0 {
		s.Year = year
	}
	return s, nil
}

// SetInitialBalance sets the initial balance for a year.
func (a *App) SetInitialBalance(year int, amount float64) error {
	db := sqlite.GlobalDB.GetDB()
	var s models.YearSettings
	if db.Where("year = ?", year).First(&s).Error == nil {
		return db.Model(&s).Update("initial_balance", amount).Error
	}
	return db.Create(&models.YearSettings{Year: year, InitialBalance: amount}).Error
}

// ============================================================
// HELPERS
// ============================================================

func entryReceipts(e models.DailyEntry) float64 {
	return e.Analyses + e.GSRH + e.ECG + e.Ecocoeur + e.HolterECG +
		e.MAPA + e.Dentiste + e.Ophtalmologie + e.Imagerie + e.Cardiologie
}

func weekBounds(t time.Time) (monday, sunday time.Time) {
	weekday := int(t.Weekday())
	if weekday == 0 {
		weekday = 7 // Sunday = 7
	}
	monday = time.Date(t.Year(), t.Month(), t.Day()-(weekday-1), 0, 0, 0, 0, t.Location())
	sunday = monday.AddDate(0, 0, 6)
	return
}

func weekIndexInMonth(t time.Time) int {
	_, weekNum := t.ISOWeek()
	firstOfMonth := time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, t.Location())
	_, firstWeekNum := firstOfMonth.ISOWeek()

	idx := weekNum - firstWeekNum
	if idx < 0 {
		idx += 53 // Handle year boundary (e.g. Jan week 1 after Dec week 53)
	}
	return idx
}

// computeBalanceUpTo computes the balance at the start of the given month/year
// (i.e., the closing balance of the previous month).
func (a *App) computeBalanceUpTo(month, year int) float64 {
	db := sqlite.GlobalDB.GetDB()

	var yearSettings models.YearSettings
	db.Where("year = ?", year).First(&yearSettings)
	balance := yearSettings.InitialBalance

	for m := 1; m < month; m++ {
		firstDay := time.Date(year, time.Month(m), 1, 0, 0, 0, 0, time.UTC)
		lastDay := firstDay.AddDate(0, 1, -1)
		firstStr := firstDay.Format("2006-01-02")
		lastStr := lastDay.Format("2006-01-02")

		var entries []models.DailyEntry
		db.Where("date BETWEEN ? AND ?", firstStr, lastStr).Find(&entries)
		receipts := 0.0
		for _, e := range entries {
			receipts += entryReceipts(e)
		}

		var honoraires []models.MonthlyHonoraire
		db.Where("month = ? AND year = ?", m, year).Find(&honoraires)
		honorTotal := 0.0
		for _, h := range honoraires {
			honorTotal += h.Amount
		}

		var expenses []models.DailyExpense
		db.Where("date BETWEEN ? AND ?", firstStr, lastStr).Find(&expenses)
		otherExp := 0.0
		for _, e := range expenses {
			otherExp += e.Amount
		}

		var investments []models.Investment
		db.Where("month = ? AND year = ?", m, year).Find(&investments)
		invTotal := 0.0
		for _, inv := range investments {
			invTotal += inv.Amount
		}

		profit := receipts - honorTotal - otherExp
		balance = balance + profit - invTotal
	}
	return balance
}

