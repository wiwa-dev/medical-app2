package sqlite

import (
	"medical-app/pkg/models"

	"gorm.io/gorm"
)

func Migration(db *gorm.DB) error {
	return db.AutoMigrate(
		&models.User{},
		&models.DailyEntry{},
		&models.DailyExpense{},
		&models.MonthlyHonoraire{},
		&models.Investment{},
		&models.YearSettings{},
	)
}
