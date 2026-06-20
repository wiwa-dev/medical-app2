package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	FirstName string `json:"FirstName"`
	LastName  string `json:"LastName"`
	Email     string `gorm:"unique"`
	Password  string `json:"Password"`
	IsAdmin   bool   `json:"Isadmin"`
}
