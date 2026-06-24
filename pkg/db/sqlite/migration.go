package sqlite

import (
	"medical-app/pkg/models"

	"gorm.io/gorm"
)

func Migration(db *gorm.DB) error {
	if err := db.AutoMigrate(
		&models.User{},
		&models.MedicalService{},
		&models.DailyEntry{},
		&models.DailyServiceValue{},
		&models.DailyExpense{},
		&models.MonthlyHonoraire{},
		&models.Investment{},
		&models.YearSettings{},
		&models.MonthlyOffre{},
		&models.Supplier{},
		&models.SupplierExpense{},
	); err != nil {
		return err
	}

	seedServices(db)
	migrateOldServiceData(db)
	return nil
}

// seedServices inserts the original 10 services if the catalogue is empty.
func seedServices(db *gorm.DB) {
	var count int64
	db.Model(&models.MedicalService{}).Count(&count)
	if count > 0 {
		return
	}

	defaults := []models.MedicalService{
		{Name: "Analyses", Label: "Analyses biologiques", ShortLabel: "Analyses", SortOrder: 1, Active: true},
		{Name: "GSRH", Label: "GSRH", ShortLabel: "Grp Sang", SortOrder: 2, Active: true},
		{Name: "ECG", Label: "ECG", ShortLabel: "ECG", SortOrder: 3, Active: true},
		{Name: "Ecocoeur", Label: "Échocœur", ShortLabel: "Echo", SortOrder: 4, Active: true},
		{Name: "HolterECG", Label: "Holter ECG", ShortLabel: "Holter", SortOrder: 5, Active: true},
		{Name: "MAPA", Label: "MAPA", ShortLabel: "MAPA", SortOrder: 6, Active: true},
		{Name: "Dentiste", Label: "Dentiste", ShortLabel: "Dentiste", SortOrder: 7, Active: true},
		{Name: "Ophtalmologie", Label: "Ophtalmologie", ShortLabel: "Ophtalmo", SortOrder: 8, Active: true},
		{Name: "Imagerie", Label: "Imagerie médicale", ShortLabel: "Imagerie", SortOrder: 9, Active: true},
		{Name: "Cardiologie", Label: "Cardiologie", ShortLabel: "Cardio", SortOrder: 10, Active: true},
	}

	for i := range defaults {
		db.Create(&defaults[i])
	}
}

// migrateOldServiceData copies values from the legacy DailyEntry columns
// (analyses, gsrh, ecg …) into the new daily_service_values table.
// Runs only once: if daily_service_values already has rows, it skips.
func migrateOldServiceData(db *gorm.DB) {
	var count int64
	db.Model(&models.DailyServiceValue{}).Count(&count)
	if count > 0 {
		return
	}

	// Read old data via raw SQL — the columns still exist in SQLite even though
	// the Go struct no longer maps to them.
	type oldRow struct {
		Date          string
		Analyses      float64
		GSRH          float64
		ECG           float64
		Ecocoeur      float64
		HolterECG     float64
		MAPA          float64
		Dentiste      float64
		Ophtalmologie float64
		Imagerie      float64
		Cardiologie   float64
	}

	var rows []oldRow
	// GORM snake_cases field names: HolterECG → holter_ecg
	db.Raw(`SELECT date, analyses, gsrh, ecg, ecocoeur, holter_ecg, mapa,
	               dentiste, ophtalmologie, imagerie, cardiologie
	        FROM daily_entries
	        WHERE deleted_at IS NULL`).Scan(&rows)

	for _, r := range rows {
		pairs := []struct {
			name   string
			amount float64
		}{
			{"Analyses", r.Analyses},
			{"GSRH", r.GSRH},
			{"ECG", r.ECG},
			{"Ecocoeur", r.Ecocoeur},
			{"HolterECG", r.HolterECG},
			{"MAPA", r.MAPA},
			{"Dentiste", r.Dentiste},
			{"Ophtalmologie", r.Ophtalmologie},
			{"Imagerie", r.Imagerie},
			{"Cardiologie", r.Cardiologie},
		}
		for _, p := range pairs {
			if p.amount > 0 {
				db.Create(&models.DailyServiceValue{
					Date:        r.Date,
					ServiceName: p.name,
					Amount:      p.amount,
				})
			}
		}
	}
}
