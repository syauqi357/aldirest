package models

import "time"

type Transaction struct {
	ID           int       `json:"id" db:"id"`
	ServiceID    int       `json:"service_id" db:"service_id"`
	ServiceName  string    `json:"service_name" db:"service_name"`
	CustomerName string    `json:"customer_name" db:"customer_name"`
	DeviceType   string    `json:"device_type" db:"device_type"`
	DeviceBrand  string    `json:"device_brand" db:"device_brand"`
	Problem      string    `json:"problem" db:"problem"` // This is "keluhan" in Indonesian
	ImagePath    *string   `json:"image_path,omitempty" db:"image_path"`
	Price        int       `json:"price" db:"price"`
	Status       string    `json:"status" db:"status"`
	Date         time.Time `json:"date" db:"date"`
}

type TransactionCreateRequest struct {
	ServiceID    int    `form:"service_id" binding:"required,gt=0"`
	CustomerName string `form:"customer_name" binding:"required"`
	DeviceType   string `form:"device_type" binding:"required"`
	DeviceBrand  string `form:"device_brand" binding:"required"`
	Problem      string `form:"problem" binding:"required"` // Keluhan - must not be empty
	Price        int    `form:"price" binding:"required,gt=0"`
	Status       string `form:"status"`
}

type TransactionUpdateRequest struct {
	ServiceID    *int    `json:"service_id" binding:"omitempty,gt=0"`
	CustomerName *string `json:"customer_name"`
	DeviceType   *string `json:"device_type"`
	DeviceBrand  *string `json:"device_brand"`
	Problem      *string `json:"problem"` // Keluhan
	Price        *int    `json:"price" binding:"omitempty,gt=0"`
	Status       *string `json:"status"`
}

// Valid status values
const (
	StatusPending    = "Pending"
	StatusInProgress = "In Progress"
	StatusCompleted  = "Completed"
	StatusCancelled  = "Cancelled"
)

func IsValidStatus(status string) bool {
	validStatuses := []string{StatusPending, StatusInProgress, StatusCompleted, StatusCancelled}
	for _, s := range validStatuses {
		if s == status {
			return true
		}
	}
	return false
}
