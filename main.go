package main

import (
	"embed"

	"log"
	"medical-app/pkg/db/sqlite"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {

	//Initialisation de la base de données
	db, e := sqlite.NewDatabase()
	if e != nil {
		log.Fatalf("Error initializing the database: %v", e)
	}

	// On passe le db ouvert a global qui sera utiliser dans les service
	sqlite.GlobalDB = db

	// Creation d'un admin'
	SeedAdmin()
	// Ferme la DB quand main() se termine
	sqlDB, er := db.GetDB().DB()
	if er == nil {
		defer sqlDB.Close()
	}
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:                    "CMSFP - Gestion Financière",
		WindowStartState:         options.Maximised,
		MinWidth:                 1024,
		MinHeight:                700,
		EnableDefaultContextMenu: true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 255},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
