package config

import (
	"os"
	"path/filepath"
)

func GetAppDataDir() string {
	appData, _ := os.UserConfigDir() // C:\Users\xxx\AppData\Roaming
	dir := filepath.Join(appData, "CMSFPApp")
	os.MkdirAll(dir, 0755)
	return dir
}

func GetHiddenDir() string {
	dir := filepath.Join(GetAppDataDir(), "database")
	os.MkdirAll(dir, 0755)
	return dir
}

func GetExportsDir() string {
	homeDir, _ := os.UserHomeDir()
	dir := filepath.Join(homeDir, "CMSFP", "Exports")
	os.MkdirAll(dir, 0755)
	return dir
}

func GetTemplateDir() string {
	dir := filepath.Join(GetAppDataDir(), "templates")
	os.MkdirAll(dir, 0755)
	return dir
}
