package main

import (
	"archive/zip"
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"medical-app/pkg/config"
	"medical-app/pkg/db/sqlite"
	"medical-app/pkg/models"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"github.com/jung-kurt/gofpdf"
	"github.com/lukasjarosch/go-docx"
	run "github.com/wailsapp/wails/v2/pkg/runtime"
	"github.com/xuri/excelize/v2"
	"golang.org/x/crypto/bcrypt"
)

var currentUser *models.User

// App struct.
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

// SaveAttachment copies a file from sourcePath to the app's documents directory
// with the given fileName (which should be the expense description).
// It sanitizes the fileName to be safe for the filesystem and preserves the
// original file extension. Returns the full destination path.
func (a *App) SaveAttachment(sourcePath string, fileName string) (string, error) {
	// Determine the destination directory
	destDir := filepath.Join(config.GetAppDataDir(), "documents")
	if err := os.MkdirAll(destDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create documents directory: %w", err)
	}

	// Get the original file extension
	ext := filepath.Ext(sourcePath)

	// Sanitize the fileName for use as a filesystem name
	safe := strings.Map(func(r rune) rune {
		if r == '.' || r == '-' || r == '_' || r == ' ' {
			return r
		}
		if r >= 'a' && r <= 'z' {
			return r
		}
		if r >= 'A' && r <= 'Z' {
			return r
		}
		if r >= '0' && r <= '9' {
			return r
		}
		// Keep common French/accented characters
		if r >= 0xC0 && r <= 0xFF {
			return r
		}
		return '_'
	}, fileName)
	// Trim spaces and collapse multiple spaces/underscores
	safe = strings.TrimSpace(safe)
	if safe == "" {
		safe = "document"
	}

	destPath := filepath.Join(destDir, safe+ext)

	// Copy the file
	srcFile, err := os.Open(sourcePath)
	if err != nil {
		return "", fmt.Errorf("failed to open source file: %w", err)
	}
	defer srcFile.Close()

	destFile, err := os.Create(destPath)
	if err != nil {
		return "", fmt.Errorf("failed to create destination file: %w", err)
	}
	defer destFile.Close()

	if _, err := io.Copy(destFile, srcFile); err != nil {
		return "", fmt.Errorf("failed to copy file: %w", err)
	}

	return destPath, nil
}

// --- AUTH ---

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

// --- SERVICES (catalogue) ---

// GetServices returns all active services ordered by SortOrder.
func (a *App) GetServices() ([]models.MedicalService, error) {
	db := sqlite.GlobalDB.GetDB()
	var services []models.MedicalService
	db.Where("active = ?", true).Order("sort_order").Find(&services)
	return services, nil
}

// CreateService adds a new service to the catalogue (admin only).
func (a *App) CreateService(service models.MedicalService) (models.MedicalService, error) {
	db := sqlite.GlobalDB.GetDB()
	if err := RequireAdmin(); err != nil {
		return models.MedicalService{}, err
	}
	service.ID = 0
	service.Active = true

	// Auto sort_order: last + 1
	if service.SortOrder == 0 {
		var max int
		db.Model(&models.MedicalService{}).Select("COALESCE(MAX(sort_order),0)").Scan(&max)
		service.SortOrder = max + 1
	}

	if err := db.Create(&service).Error; err != nil {
		return models.MedicalService{}, err
	}
	return service, nil
}

// UpdateService updates an existing service (admin only).
func (a *App) UpdateService(service models.MedicalService) (models.MedicalService, error) {
	db := sqlite.GlobalDB.GetDB()
	if err := RequireAdmin(); err != nil {
		return models.MedicalService{}, err
	}
	if err := db.Save(&service).Error; err != nil {
		return models.MedicalService{}, err
	}
	return service, nil
}

// DeleteService soft-deactivates a service (admin only).
// Historical data in daily_service_values is preserved.
func (a *App) DeleteService(id uint) error {
	db := sqlite.GlobalDB.GetDB()
	if err := RequireAdmin(); err != nil {
		return err
	}
	return db.Model(&models.MedicalService{}).Where("id = ?", id).Update("active", false).Error
}

// --- SAISIE JOURNALIERE ---

// GetDailyEntry returns the entry + service values + expenses for a given date.
func (a *App) GetDailyEntry(date string) (models.DailyEntryWithExpenses, error) {
	db := sqlite.GlobalDB.GetDB()

	var entry models.DailyEntry
	db.Where("date = ?", date).First(&entry)
	if entry.Date == "" {
		entry.Date = date
	}

	var serviceValues []models.DailyServiceValue
	db.Where("date = ?", date).Find(&serviceValues)

	var expenses []models.DailyExpense
	db.Where("date = ?", date).Order("id").Find(&expenses)

	return models.DailyEntryWithExpenses{
		Entry:         entry,
		ServiceValues: serviceValues,
		Expenses:      expenses,
	}, nil
}

// SaveDailyEntry saves (upsert) an entry's service values + expenses for a given date.
func (a *App) SaveDailyEntry(date string, serviceValues []models.DailyServiceValue, expenses []models.DailyExpense) error {
	db := sqlite.GlobalDB.GetDB()

	// Upsert DailyEntry (date + status)
	var existing models.DailyEntry
	if db.Where("date = ?", date).First(&existing).Error == nil {
		db.Model(&existing).Update("status", "validated")
	} else {
		db.Create(&models.DailyEntry{Date: date, Status: "validated"})
	}

	// Replace service values for this date (hard-delete to avoid UNIQUE constraint violation with soft-deleted rows)
	db.Where("date = ?", date).Unscoped().Delete(&models.DailyServiceValue{})
	for i := range serviceValues {
		serviceValues[i].ID = 0
		serviceValues[i].Date = date
		if serviceValues[i].Amount > 0 {
			if err := db.Create(&serviceValues[i]).Error; err != nil {
				return err
			}
		}
	}

	// Replace expenses for this date (hard-delete for consistency)
	db.Where("date = ?", date).Unscoped().Delete(&models.DailyExpense{})
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

	// Aggregate service value totals per date
	type dateTotal struct {
		Date  string
		Total float64
	}
	var receiptTotals []dateTotal
	db.Model(&models.DailyServiceValue{}).
		Select("date, SUM(amount) as total").
		Where("date BETWEEN ? AND ?", mondayStr, sundayStr).
		Group("date").
		Scan(&receiptTotals)

	receiptByDate := make(map[string]float64)
	for _, r := range receiptTotals {
		receiptByDate[r.Date] = r.Total
	}

	var rawExpenses []models.DailyExpense
	db.Where("date BETWEEN ? AND ?", mondayStr, sundayStr).Find(&rawExpenses)
	expByDate := make(map[string]float64)
	for _, e := range rawExpenses {
		expByDate[e.Date] += e.Amount
	}

	result := make([]models.DayHistoryRow, 0, len(entries))
	for _, e := range entries {
		totalR := receiptByDate[e.Date]
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

// --- RAPPORT MENSUEL ---

// GetMonthlyReport returns the full aggregated monthly report.
func (a *App) GetMonthlyReport(month, year int) (models.MonthlyReport, error) {
	db := sqlite.GlobalDB.GetDB()

	firstDay := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
	lastDay := firstDay.AddDate(0, 1, -1)
	firstStr := firstDay.Format("2006-01-02")
	lastStr := lastDay.Format("2006-01-02")

	// Load all service values for the month
	var allSVs []models.DailyServiceValue
	db.Where("date BETWEEN ? AND ?", firstStr, lastStr).Find(&allSVs)

	// Determine week count
	maxWeekIdx := 0
	for _, sv := range allSVs {
		t, _ := time.Parse("2006-01-02", sv.Date)
		idx := weekIndexInMonth(t)
		if idx > maxWeekIdx {
			maxWeekIdx = idx
		}
	}
	weekCount := maxWeekIdx + 1
	if weekCount < 4 {
		weekCount = 4
	}

	// Group service values by service name and week index
	type key struct {
		name string
		week int
	}
	svMap := make(map[key]float64)
	totalReceipts := 0.0
	for _, sv := range allSVs {
		t, _ := time.Parse("2006-01-02", sv.Date)
		idx := weekIndexInMonth(t)
		if idx < weekCount {
			svMap[key{sv.ServiceName, idx}] += sv.Amount
		}
		totalReceipts += sv.Amount
	}

	// Get active services in order to report rows
	var activeServices []models.MedicalService
	db.Where("active = ?", true).Order("sort_order").Find(&activeServices)

	weekTotals := make([]float64, weekCount)
	var serviceData []models.ServiceWeekData

	for _, svc := range activeServices {
		weeks := make([]float64, weekCount)
		total := 0.0
		for w := 0; w < weekCount; w++ {
			v := svMap[key{svc.Name, w}]
			weeks[w] = v
			total += v
			weekTotals[w] += v
		}
		if total > 0 {
			serviceData = append(serviceData, models.ServiceWeekData{
				Service: svc.Label,
				Weeks:   weeks,
				Total:   total,
			})
		}
	}

	// Honoraires
	var honoraires []models.MonthlyHonoraire
	db.Where("month = ? AND year = ?", month, year).Find(&honoraires)
	totalHonoraires := 0.0
	for _, h := range honoraires {
		totalHonoraires += h.Amount
	}

	// Offres (informational only)
	var offres []models.MonthlyOffre
	db.Where("month = ? AND year = ?", month, year).Find(&offres)
	offresAgentEtat := 0.0
	offresNonAyantDroit := 0.0
	for _, o := range offres {
		switch o.Category {
		case "Agent_Etat":
			offresAgentEtat = o.Amount
		case "Non_Ayant_Droit":
			offresNonAyantDroit = o.Amount
		}
	}
	totalOffres := offresAgentEtat + offresNonAyantDroit

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
		Month:               month,
		Year:                year,
		WeekCount:           weekCount,
		Services:            serviceData,
		WeekTotals:          weekTotals,
		TotalReceipts:       totalReceipts,
		Honoraires:          honoraires,
		TotalHonoraires:     totalHonoraires,
		OtherExpensesTotal:  otherExpTotal,
		Investments:         investments,
		TotalInvestments:    totalInvestments,
		TotalExpenses:       totalExpenses,
		PreviousBalance:     prevBalance,
		Profit:              profit,
		FinalBalance:        finalBalance,
		OffresAgentEtat:     offresAgentEtat,
		OffresNonAyantDroit: offresNonAyantDroit,
		TotalOffres:         totalOffres,
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

// GetMonthlyOffres retrieves the two offer amounts for a month/year.
func (a *App) GetMonthlyOffres(month, year int) ([]models.MonthlyOffre, error) {
	db := sqlite.GlobalDB.GetDB()
	var offres []models.MonthlyOffre
	db.Where("month = ? AND year = ?", month, year).Find(&offres)
	return offres, nil
}

// SaveMonthlyOffres saves the two offer amounts for a month/year (replaces existing).
func (a *App) SaveMonthlyOffres(month, year int, offres []models.MonthlyOffre) error {
	db := sqlite.GlobalDB.GetDB()
	db.Where("month = ? AND year = ?", month, year).Unscoped().Delete(&models.MonthlyOffre{})
	for i := range offres {
		offres[i].ID = 0
		offres[i].Month = month
		offres[i].Year = year
		if err := db.Create(&offres[i]).Error; err != nil {
			return err
		}
	}
	return nil
}

// --- BILAN ANNUEL ---

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

		receipts := sumServiceValues(firstStr, lastStr)

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

	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
	}

	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "#FFFFFF", Size: 11},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"#002045"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})
	lastHeaderCell, _ := excelize.CoordinatesToCellName(len(headers), 1)
	f.SetCellStyle(sheet, "A1", lastHeaderCell, headerStyle)

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

	totalStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Size: 11},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"#E5EEFF"}, Pattern: 1},
	})
	lastTotalCell, _ := excelize.CoordinatesToCellName(len(headers), totalRow)
	totalRowCell, _ := excelize.CoordinatesToCellName(1, totalRow)
	f.SetCellStyle(sheet, totalRowCell, lastTotalCell, totalStyle)

	for i := 1; i <= len(headers); i++ {
		col, _ := excelize.ColumnNumberToName(i)
		f.SetColWidth(sheet, col, col, 24)
	}

	dir := config.GetExportsDir()
	filePath := filepath.Join(dir, fmt.Sprintf("bilan_annuel_%d_%d.xlsx", year, time.Now().Unix()))
	if err := f.SaveAs(filePath); err != nil {
		return "", err
	}
	return filePath, nil
}

// --- YEAR SETTINGS ---

func (a *App) GetYearSettings(year int) (models.YearSettings, error) {
	db := sqlite.GlobalDB.GetDB()
	var s models.YearSettings
	db.Where("year = ?", year).First(&s)
	if s.Year == 0 {
		s.Year = year
	}
	return s, nil
}

func (a *App) SetInitialBalance(year int, amount float64) error {
	db := sqlite.GlobalDB.GetDB()
	var s models.YearSettings
	if db.Where("year = ?", year).First(&s).Error == nil {
		return db.Model(&s).Update("initial_balance", amount).Error
	}
	return db.Create(&models.YearSettings{Year: year, InitialBalance: amount}).Error
}

// --- SUPPLIER BUDGET TRACKING ---

// CreateSupplier creates a new supplier with the given name, budget year, and committed amount.
func (a *App) CreateSupplier(name string, budgetYear int, amountEngaged float64) (*models.Supplier, error) {
	db := sqlite.GlobalDB.GetDB()
	supplier := &models.Supplier{
		Name:          name,
		BudgetYear:    budgetYear,
		AmountEngaged: amountEngaged,
	}
	if err := db.Create(supplier).Error; err != nil {
		return nil, err
	}
	return supplier, nil
}

// UpdateSupplier updates an existing supplier's fields.
func (a *App) UpdateSupplier(id uint, name string, budgetYear int, amountEngaged float64) (*models.Supplier, error) {
	db := sqlite.GlobalDB.GetDB()
	var supplier models.Supplier
	if err := db.First(&supplier, id).Error; err != nil {
		return nil, fmt.Errorf("fournisseur non trouvé: %w", err)
	}
	supplier.Name = name
	supplier.BudgetYear = budgetYear
	supplier.AmountEngaged = amountEngaged
	if err := db.Save(&supplier).Error; err != nil {
		return nil, err
	}
	return &supplier, nil
}

// DeleteSupplier soft-deletes a supplier by ID.
func (a *App) DeleteSupplier(id uint) error {
	db := sqlite.GlobalDB.GetDB()
	return db.Delete(&models.Supplier{}, id).Error
}

// GetSuppliers returns all suppliers filtered by budget year.
func (a *App) GetSuppliers(budgetYear int) ([]models.Supplier, error) {
	db := sqlite.GlobalDB.GetDB()
	var suppliers []models.Supplier
	db.Where("budget_year = ?", budgetYear).Order("name").Find(&suppliers)
	return suppliers, nil
}

// GetAllSuppliers returns all suppliers ordered by name.
func (a *App) GetAllSuppliers() ([]models.Supplier, error) {
	db := sqlite.GlobalDB.GetDB()
	var suppliers []models.Supplier
	db.Order("name").Find(&suppliers)
	return suppliers, nil
}

// AddSupplierExpense records a new expense against a supplier.
func (a *App) AddSupplierExpense(supplierID uint, amount float64, description string, date string) (*models.SupplierExpense, error) {
	db := sqlite.GlobalDB.GetDB()
	// Verify supplier exists
	var supplier models.Supplier
	if err := db.First(&supplier, supplierID).Error; err != nil {
		return nil, fmt.Errorf("fournisseur non trouvé: %w", err)
	}
	expense := &models.SupplierExpense{
		SupplierID:  supplierID,
		Amount:      amount,
		Description: description,
		Date:        date,
	}
	if err := db.Create(expense).Error; err != nil {
		return nil, err
	}
	return expense, nil
}

// DeleteSupplierExpense soft-deletes a supplier expense by ID.
func (a *App) DeleteSupplierExpense(id uint) error {
	db := sqlite.GlobalDB.GetDB()
	return db.Delete(&models.SupplierExpense{}, id).Error
}

// GetSupplierExpenses returns all expenses for a given supplier, ordered by date descending.
func (a *App) GetSupplierExpenses(supplierID uint) ([]models.SupplierExpense, error) {
	db := sqlite.GlobalDB.GetDB()
	var expenses []models.SupplierExpense
	db.Where("supplier_id = ?", supplierID).Order("date DESC, id DESC").Find(&expenses)
	return expenses, nil
}

// GetSupplierBudgetSummary returns the budget summary for all suppliers for a given year.
// It computes total expenses per supplier and the remaining balance.
func (a *App) GetSupplierBudgetSummary(year int) ([]models.SupplierBudgetSummary, error) {
	db := sqlite.GlobalDB.GetDB()
	var suppliers []models.Supplier
	db.Order("name").Find(&suppliers)

	results := make([]models.SupplierBudgetSummary, 0, len(suppliers))
	for _, s := range suppliers {
		type expenseTotal struct {
			Total float64
		}
		var et expenseTotal
		db.Model(&models.SupplierExpense{}).
			Select("COALESCE(SUM(amount), 0) as total").
			Where("supplier_id = ?", s.ID).
			Scan(&et)

		results = append(results, models.SupplierBudgetSummary{
			ID:            s.ID,
			Name:          s.Name,
			BudgetYear:    s.BudgetYear,
			AmountEngaged: s.AmountEngaged,
			TotalExpenses: et.Total,
			Remaining:     s.AmountEngaged - et.Total,
		})
	}
	return results, nil
}

// --- EXPORT DAILY PDF ---

// ExportDailyPDF generates a PDF report for the daily entry on the given date.
// It returns the file path to the generated PDF.
func (a *App) ExportDailyPDF(date string) (string, error) {
	// Load daily entry data
	entry, err := a.GetDailyEntry(date)
	if err != nil {
		return "", fmt.Errorf("failed to load daily entry: %w", err)
	}

	// Load supplier expenses for this date
	db := sqlite.GlobalDB.GetDB()
	var supplierExpenses []models.SupplierExpense
	db.Where("date = ?", date).Order("id").Find(&supplierExpenses)

	// Enrich supplier expenses with supplier names
	type supplierExpenseRow struct {
		SupplierName string
		Amount       float64
		Description  string
	}
	var supplierRows []supplierExpenseRow
	for _, se := range supplierExpenses {
		var s models.Supplier
		if db.First(&s, se.SupplierID).Error == nil {
			supplierRows = append(supplierRows, supplierExpenseRow{
				SupplierName: s.Name,
				Amount:       se.Amount,
				Description:  se.Description,
			})
		}
	}

	// Compute totals
	totalReceipts := 0.0
	for _, sv := range entry.ServiceValues {
		totalReceipts += sv.Amount
	}
	totalExpenses := 0.0
	for _, e := range entry.Expenses {
		totalExpenses += e.Amount
	}
	totalSupplierExp := 0.0
	for _, se := range supplierExpenses {
		totalSupplierExp += se.Amount
	}
	//netBalance := totalReceipts - totalExpenses - totalSupplierExp

	// Create PDF
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 20)
	pdf.AddPage()

	// --- Header ---
	pdf.SetFont("Helvetica", "B", 18)
	pdf.SetTextColor(0, 32, 69)
	pdf.CellFormat(0, 15, "Suivi Journalier", "", 1, "C", false, 0, "")
	pdf.SetFont("Helvetica", "", 12)
	pdf.SetTextColor(80, 80, 80)
	pdf.CellFormat(0, 8, date, "", 1, "C", false, 0, "")
	pdf.Ln(5)

	// --- Summary Cards ---
	pdf.SetFont("Helvetica", "B", 10)
	pdf.SetFillColor(0, 32, 69)
	pdf.SetTextColor(255, 255, 255)
	pdf.CellFormat(190, 7, "Resume", "1", 1, "C", true, 0, "")

	pdf.SetFont("Helvetica", "", 9)
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFillColor(220, 230, 241)

	summaryData := []struct {
		label string
		value float64
		color []int
	}{
		{"Total Recettes (FCFA)", totalReceipts, []int{0, 150, 0}},
		{"Total Depenses (FCFA)", totalExpenses, []int{200, 0, 0}},
		{"Depenses Fournisseurs (FCFA)", totalSupplierExp, []int{200, 100, 0}},
		//{"Solde Net (FCFA)", netBalance, []int{0, 80, 160}},
	}

	for _, sd := range summaryData {
		pdf.SetFillColor(245, 245, 245)
		pdf.CellFormat(130, 6, sd.label, "1", 0, "L", true, 0, "")
		pdf.SetTextColor(sd.color[0], sd.color[1], sd.color[2])
		pdf.SetFont("Helvetica", "B", 9)
		pdf.CellFormat(60, 6, fmt.Sprintf("%.0f FCFA", sd.value), "1", 1, "R", true, 0, "")
		pdf.SetFont("Helvetica", "", 9)
		pdf.SetTextColor(0, 0, 0)
	}
	pdf.Ln(5)

	// --- Receipts by Service Table ---
	pdf.SetFont("Helvetica", "B", 10)
	pdf.SetFillColor(0, 32, 69)
	pdf.SetTextColor(255, 255, 255)
	pdf.CellFormat(190, 7, "Recettes par Service", "1", 1, "C", true, 0, "")

	// Table header
	pdf.SetFont("Helvetica", "B", 8)
	pdf.SetFillColor(200, 210, 230)
	pdf.SetTextColor(0, 0, 0)
	pdf.CellFormat(140, 6, "Service", "1", 0, "C", true, 0, "")
	pdf.CellFormat(50, 6, "Montant (FCFA)", "1", 1, "C", true, 0, "")

	// Table rows
	pdf.SetFont("Helvetica", "", 8)
	lineH := 5.0
	fill := false
	for _, sv := range entry.ServiceValues {
		svName := toLatin1(sv.ServiceName)
		splitName := pdf.SplitText(svName, 140)
		numLines := len(splitName)
		rowH := float64(numLines) * lineH

		x0 := pdf.GetX()
		y0 := pdf.GetY()

		if fill {
			pdf.SetFillColor(240, 244, 250)
		} else {
			pdf.SetFillColor(255, 255, 255)
		}
		pdf.Rect(x0, y0, 190, rowH, "FD")

		pdf.SetXY(x0, y0+0.5)
		pdf.MultiCell(140, lineH, svName, "", "L", false)

		pdf.Line(x0+140, y0, x0+140, y0+rowH)

		pdf.SetXY(x0+140, y0)
		pdf.CellFormat(50, rowH, fmt.Sprintf("%.0f", sv.Amount), "", 1, "R", false, 0, "")
		fill = !fill
	}
	// Total row
	pdf.SetFont("Helvetica", "B", 8)
	pdf.SetFillColor(220, 230, 241)
	pdf.CellFormat(140, 6, "TOTAL RECETTES", "1", 0, "L", true, 0, "")
	pdf.CellFormat(50, 6, fmt.Sprintf("%.0f FCFA", totalReceipts), "1", 1, "R", true, 0, "")
	pdf.Ln(5)

	// --- Daily Expenses Table ---
	pdf.SetFont("Helvetica", "B", 10)
	pdf.SetFillColor(0, 32, 69)
	pdf.SetTextColor(255, 255, 255)
	pdf.CellFormat(190, 7, "Depenses Journalieres", "1", 1, "C", true, 0, "")

	// Table header
	pdf.SetFont("Helvetica", "B", 8)
	pdf.SetFillColor(200, 210, 230)
	pdf.SetTextColor(0, 0, 0)
	pdf.CellFormat(140, 6, "Description", "1", 0, "C", true, 0, "")
	pdf.CellFormat(50, 6, "Montant (FCFA)", "1", 1, "C", true, 0, "")

	// Table rows
	pdf.SetFont("Helvetica", "", 8)
	lineH = 5.0
	fill = false
	for _, e := range entry.Expenses {
		desc := e.Description
		if desc == "" {
			desc = "-"
		}
		desc = toLatin1(desc)
		splitDesc := pdf.SplitText(desc, 140)
		numLines := len(splitDesc)
		rowH := float64(numLines) * lineH

		x0 := pdf.GetX()
		y0 := pdf.GetY()

		if fill {
			pdf.SetFillColor(240, 244, 250)
		} else {
			pdf.SetFillColor(255, 255, 255)
		}
		pdf.Rect(x0, y0, 190, rowH, "FD")

		pdf.SetXY(x0, y0+0.5)
		pdf.MultiCell(140, lineH, desc, "", "L", false)

		pdf.Line(x0+140, y0, x0+140, y0+rowH)

		pdf.SetXY(x0+140, y0)
		pdf.CellFormat(50, rowH, fmt.Sprintf("%.0f", e.Amount), "", 1, "R", false, 0, "")
		fill = !fill
	}
	// Total row
	pdf.SetFont("Helvetica", "B", 8)
	pdf.SetFillColor(220, 230, 241)
	pdf.CellFormat(140, 6, "TOTAL DEPENSES", "1", 0, "L", true, 0, "")
	pdf.CellFormat(50, 6, fmt.Sprintf("%.0f FCFA", totalExpenses), "1", 1, "R", true, 0, "")
	pdf.Ln(5)

	// --- Supplier Expenses Table (only if there are any) ---
	if len(supplierRows) > 0 {
		pdf.SetFont("Helvetica", "B", 10)
		pdf.SetFillColor(0, 32, 69)
		pdf.SetTextColor(255, 255, 255)
		pdf.CellFormat(190, 7, "Depenses Fournisseurs", "1", 1, "C", true, 0, "")

		// Table header
		pdf.SetFont("Helvetica", "B", 8)
		pdf.SetFillColor(200, 210, 230)
		pdf.SetTextColor(0, 0, 0)
		pdf.CellFormat(60, 6, "Fournisseur", "1", 0, "C", true, 0, "")
		pdf.CellFormat(80, 6, "Description", "1", 0, "C", true, 0, "")
		pdf.CellFormat(50, 6, "Montant (FCFA)", "1", 1, "C", true, 0, "")

		// Table rows
		pdf.SetFont("Helvetica", "", 8)
		lineH = 5.0
		fill = false
		for _, sr := range supplierRows {
			if fill {
				pdf.SetFillColor(240, 244, 250)
			} else {
				pdf.SetFillColor(255, 255, 255)
			}
			supplierName := toLatin1(sr.SupplierName)
			desc := sr.Description
			if desc == "" {
				desc = "-"
			}
			desc = toLatin1(desc)
			splitName := pdf.SplitText(supplierName, 60)
			splitDesc := pdf.SplitText(desc, 80)
			numLines := len(splitName)
			if len(splitDesc) > numLines {
				numLines = len(splitDesc)
			}
			rowH := float64(numLines) * lineH

			x0 := pdf.GetX()
			y0 := pdf.GetY()

			pdf.Rect(x0, y0, 190, rowH, "FD")

			pdf.SetXY(x0, y0+0.5)
			pdf.MultiCell(60, lineH, supplierName, "", "L", false)

			pdf.Line(x0+60, y0, x0+60, y0+rowH)

			pdf.SetXY(x0+60, y0+0.5)
			pdf.MultiCell(80, lineH, desc, "", "L", false)

			pdf.Line(x0+140, y0, x0+140, y0+rowH)

			pdf.SetXY(x0+140, y0)
			pdf.CellFormat(50, rowH, fmt.Sprintf("%.0f", sr.Amount), "", 1, "R", false, 0, "")
			fill = !fill
		}
		// Total row
		pdf.SetFont("Helvetica", "B", 8)
		pdf.SetFillColor(220, 230, 241)
		pdf.CellFormat(140, 6, "TOTAL FOURNISSEURS", "1", 0, "L", true, 0, "")
		pdf.CellFormat(50, 6, fmt.Sprintf("%.0f FCFA", totalSupplierExp), "1", 1, "R", true, 0, "")
	}

	// --- Footer with generation info ---
	pdf.SetY(-20)
	pdf.SetFont("Helvetica", "I", 7)
	pdf.SetTextColor(150, 150, 150)
	nowStr := time.Now().Format("02/01/2006 15:04")
	pdf.CellFormat(0, 10, fmt.Sprintf("Genere le %s", nowStr), "", 1, "C", false, 0, "")

	// Save to exports directory
	dir := config.GetExportsDir()
	filePath := filepath.Join(dir, fmt.Sprintf("suivi_journalier_%s_%d.pdf", date, time.Now().Unix()))
	if err := pdf.OutputFileAndClose(filePath); err != nil {
		return "", fmt.Errorf("failed to save PDF: %w", err)
	}
	return filePath, nil
}

// createDechargeTemplateBytes generates a minimal DOCX template containing
// placeholder markers ({BENEFICIARY}, {AMOUNT}, {AMOUNT_WORDS}, {DESCRIPTION},
// {DATE}, {CIN}) that will be replaced at runtime with actual values.
func createDechargeTemplateBytes() ([]byte, error) {
	buf := new(bytes.Buffer)
	w := zip.NewWriter(buf)

	// [Content_Types].xml
	typesContent := []byte(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`)
	f, _ := w.Create("[Content_Types].xml")
	f.Write(typesContent)

	// _rels/.rels
	relsContent := []byte(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)
	f, _ = w.Create("_rels/.rels")
	f.Write(relsContent)

	// word/_rels/document.xml.rels
	docRelsContent := []byte(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`)
	f, _ = w.Create("word/_rels/document.xml.rels")
	f.Write(docRelsContent)

	// word/document.xml – formatted discharge template with placeholders
	docContent := []byte(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <!-- Title: DECHARGE (bold, centered, 26pt) -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="400"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="40"/>
        </w:rPr>
        <w:t>DECHARGE</w:t>
      </w:r>
    </w:p>

    <!-- Body text (12pt) -->
    <w:p>
      <w:pPr>
        <w:spacing w:after="400"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="28"/>
        </w:rPr>
        <w:t xml:space="preserve">Je soussigné(e), {BENEFICIARY} déclare avoir recu la somme de {AMOUNT} ({AMOUNT_WORDS} francs CFA) pour {DESCRIPTION}.</w:t>
      </w:r>
    </w:p>

    <!-- Date line -->
    <w:p>
      <w:pPr>
        <w:jc w:val="left"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="28"/>
        </w:rPr>
        <w:t>Dakar, {DATE}</w:t>
      </w:r>
    </w:p>

    <!-- CIN line -->
    <w:p>
      <w:pPr>
        <w:jc w:val="left"/>
        <w:spacing w:after="400"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="28"/>
        </w:rPr>
        <w:t>CIN: {CIN}</w:t>
      </w:r>
    </w:p>

    <!-- Signature -->
    <w:p>
      <w:pPr>
        <w:jc w:val="left"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="28"/>
        </w:rPr>
        <w:t>Signature</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`)
	f, _ = w.Create("word/document.xml")
	f.Write(docContent)

	if err := w.Close(); err != nil {
		return nil, fmt.Errorf("failed to finalize DOCX template: %w", err)
	}
	return buf.Bytes(), nil
}

// GenerateDecharge generates a DOCX discharge/receipt for an expense using
// the DECHARGE MELVYN 1.docx template with placeholder replacement.
func (a *App) GenerateDecharge(date string, description string, amount float64, beneficiaryName string, cin string) (string, error) {
	templateBytes, err := createDechargeTemplateBytes()
	if err != nil {
		return "", fmt.Errorf("failed to create template: %w", err)
	}

	doc, err := docx.OpenBytes(templateBytes)
	if err != nil {
		return "", fmt.Errorf("failed to open DOCX template: %w", err)
	}
	defer doc.Close()

	amountInt := int(amount)
	words := numberToWords(amountInt)

	// Format date
	parsedDate, err := time.Parse("2006-01-02", date)
	dateStr := date
	if err == nil {
		monthsFR := map[time.Month]string{
			time.January: "Janvier", time.February: "Fevrier", time.March: "Mars",
			time.April: "Avril", time.May: "Mai", time.June: "Juin",
			time.July: "Juillet", time.August: "Aout", time.September: "Septembre",
			time.October: "Octobre", time.November: "Novembre", time.December: "Decembre",
		}
		dateStr = fmt.Sprintf("le %d %s %d", parsedDate.Day(), monthsFR[parsedDate.Month()], parsedDate.Year())
	}

	replaceMap := docx.PlaceholderMap{
		"BENEFICIARY":  beneficiaryName,
		"AMOUNT":       fmt.Sprintf("%d", amountInt),
		"AMOUNT_WORDS": words,
		"DESCRIPTION":  description,
		"DATE":         dateStr,
		"CIN":          cin,
	}

	if err := doc.ReplaceAll(replaceMap); err != nil {
		return "", fmt.Errorf("failed to replace placeholders: %w", err)
	}

	dir := config.GetExportsDir()
	filePath := filepath.Join(dir, fmt.Sprintf("decharge_%s_%d.docx", date, time.Now().Unix()))
	if err := doc.WriteToFile(filePath); err != nil {
		return "", fmt.Errorf("failed to save DOCX: %w", err)
	}
	return filePath, nil
}

// --- HELPERS ---

// toLatin1 transliterates French UTF-8 accented characters to their ASCII
// equivalents, so they render correctly with gofpdf's built-in Helvetica font
// (which only supports Latin-1/cp1252 encoding).
func toLatin1(s string) string {
	replacer := strings.NewReplacer(
		"é", "e", "è", "e", "ê", "e", "ë", "e",
		"É", "E", "È", "E", "Ê", "E", "Ë", "E",
		"à", "a", "â", "a", "ä", "a",
		"À", "A", "Â", "A", "Ä", "A",
		"ô", "o", "ö", "o",
		"Ô", "O", "Ö", "O",
		"ù", "u", "û", "u", "ü", "u",
		"Ù", "U", "Û", "U", "Ü", "U",
		"î", "i", "ï", "i",
		"Î", "I", "Ï", "I",
		"ç", "c", "Ç", "C",
		"\u2018", "'", "\u2019", "'", "\u201b", "'",
		"\u201c", "\"", "\u201d", "\"", "\u201e", "\"",
		"\u2013", "-", "\u2014", "-",
		"\u00a0", " ", // non-breaking space
	)
	return replacer.Replace(s)
}

// sumServiceValues returns total receipts from DailyServiceValue for a date range.
func sumServiceValues(firstStr, lastStr string) float64 {
	db := sqlite.GlobalDB.GetDB()
	type result struct{ Total float64 }
	var r result
	db.Model(&models.DailyServiceValue{}).
		Select("COALESCE(SUM(amount), 0) as total").
		Where("date BETWEEN ? AND ?", firstStr, lastStr).
		Scan(&r)
	return r.Total
}

func weekBounds(t time.Time) (monday, sunday time.Time) {
	weekday := int(t.Weekday())
	if weekday == 0 {
		weekday = 7
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
		idx += 53
	}
	return idx
}

// computeBalanceUpTo computes the balance at the start of the given month/year.
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

		type sumResult struct{ Total float64 }
		var r sumResult
		db.Model(&models.DailyServiceValue{}).
			Select("COALESCE(SUM(amount), 0) as total").
			Where("date BETWEEN ? AND ?", firstStr, lastStr).
			Scan(&r)
		receipts := r.Total

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

// numberToWords converts an integer amount to French words (e.g. 250000 → "deux cent cinquante mille").
func numberToWords(amount int) string {
	if amount == 0 {
		return "zéro"
	}

	units := []string{"", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
		"dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"}

	tens := []string{"", "dix", "vingt", "trente", "quarante", "cinquante", "soixante",
		"soixante-dix", "quatre-vingt", "quatre-vingt-dix"}

	var f func(n int) string
	f = func(n int) string {
		if n == 0 {
			return ""
		}
		var parts []string
		h := n / 100
		r := n % 100
		if h > 0 {
			if h == 1 {
				parts = append(parts, "cent")
			} else {
				parts = append(parts, f(h), "cent")
			}
		}
		if r > 0 {
			if r < 20 {
				parts = append(parts, units[r])
			} else {
				t := r / 10
				u := r % 10
				switch t {
				case 7:
					if u == 1 {
						parts = append(parts, "soixante-et-onze")
					} else {
						parts = append(parts, "soixante-"+units[10+u])
					}
				case 9:
					if u == 1 {
						parts = append(parts, "quatre-vingt-onze")
					} else {
						parts = append(parts, "quatre-vingt-"+units[10+u])
					}
				default:
					base := tens[t]
					if u == 1 && t != 8 {
						base += "-et-un"
					} else if u > 0 {
						base += "-" + units[u]
					}
					parts = append(parts, base)
				}
			}
		}
		return strings.Join(parts, " ")
	}

	var result string
	mil := amount / 1000000
	rem := amount % 1000000
	if mil > 0 {
		if mil == 1 {
			result = "un million"
		} else {
			result = f(mil) + " millions"
		}
	}

	th := rem / 1000
	rem = rem % 1000
	if th > 0 {
		if result != "" {
			result += " "
		}
		if th == 1 {
			result += "mille"
		} else {
			result += f(th) + " mille"
		}
	}

	if rem > 0 {
		if result != "" {
			result += " "
		}
		result += f(rem)
	}

	if result == "" {
		return "zéro"
	}
	return result
}
