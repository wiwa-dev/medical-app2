package sqlite

import (
	"fmt"
	"medical-app/pkg/config"
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

// creation d'une base de donnee de type DB pour l'ensemble de l'ecosysteme. Ce dernier sera intancier dés l'ouverture du server dans main()
var GlobalDB *DB

type DB struct {
	db *gorm.DB
}

func NewDatabase() (*DB, error) {
	fileDB := filepath.Join(config.GetHiddenDir(), "donnee.db")

	db, err := gorm.Open(sqlite.Open(fileDB+"?_pragma=foreign_keys(1)"), &gorm.Config{})

	if err != nil {
		fmt.Println("Error Open sqlite", err)
		return nil, err
	}

	err = Migration(db)
	if err != nil {
		fmt.Println("Migration error:", err)
	}
	return &DB{db: db}, nil
}

func (d *DB) GetDB() *gorm.DB {
	return d.db
}

func FileToString(filename string) string {
	file, err := os.ReadFile(filename)
	if err != nil {
		fmt.Println("Could not read file:", err)
		return ""
	}
	return string(file)
}
