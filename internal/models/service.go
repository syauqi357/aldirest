package models

import "time"

type Service struct {
	ID          int       `json:"id" db:"id"`
	Name        string    `json:"name" db:"name" binding:"required"`
	Price       int       `json:"price" db:"price" binding:"required,gt=0"`
	Description string    `json:"description" db:"description"`
	CreatedAt   time.Time `json:"created_at,omitempty" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at,omitempty" db:"updated_at"`
}

type ServiceCreateRequest struct {
	Name        string `json:"name" binding:"required"`
	Price       int    `json:"price" binding:"required,gt=0"`
	Description string `json:"description"`
}

type ServiceUpdateRequest struct {
	Name        *string `json:"name"`
	Price       *int    `json:"price" binding:"omitempty,gt=0"`
	Description *string `json:"description"`
}
