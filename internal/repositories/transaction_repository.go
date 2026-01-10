package repositories

import (
	"database/sql"
	"fmt"
	"strings"

	"aldirest/internal/models"
)

type TransactionRepository struct {
	db *sql.DB
}

func NewTransactionRepository(db *sql.DB) *TransactionRepository {
	return &TransactionRepository{db: db}
}

func (r *TransactionRepository) GetAll() ([]models.Transaction, error) {
	query := `
		SELECT 
			st.id,
			st.service_id,
			s.name as service_name,
			st.customer_name,
			st.device_type,
			st.device_brand,
			st.problem,
			st.image_path,
			st.price,
			st.status,
			st.date
		FROM service_transactions st
		JOIN service s ON st.service_id = s.id
		ORDER BY st.date DESC
	`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []models.Transaction
	for rows.Next() {
		var t models.Transaction
		err := rows.Scan(
			&t.ID,
			&t.ServiceID,
			&t.ServiceName,
			&t.CustomerName,
			&t.DeviceType,
			&t.DeviceBrand,
			&t.Problem,
			&t.ImagePath,
			&t.Price,
			&t.Status,
			&t.Date,
		)
		if err != nil {
			return nil, err
		}
		transactions = append(transactions, t)
	}

	return transactions, nil
}

func (r *TransactionRepository) GetByID(id int) (*models.Transaction, error) {
	query := `
		SELECT 
			st.id,
			st.service_id,
			s.name as service_name,
			st.customer_name,
			st.device_type,
			st.device_brand,
			st.problem,
			st.image_path,
			st.price,
			st.status,
			st.date
		FROM service_transactions st
		JOIN service s ON st.service_id = s.id
		WHERE st.id = ?
	`
	var t models.Transaction
	err := r.db.QueryRow(query, id).Scan(
		&t.ID,
		&t.ServiceID,
		&t.ServiceName,
		&t.CustomerName,
		&t.DeviceType,
		&t.DeviceBrand,
		&t.Problem,
		&t.ImagePath,
		&t.Price,
		&t.Status,
		&t.Date,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TransactionRepository) Create(t *models.Transaction) (int64, error) {
	query := `
		INSERT INTO service_transactions 
		(service_id, customer_name, device_type, device_brand, problem, price, status, image_path) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`
	result, err := r.db.Exec(
		query,
		t.ServiceID,
		t.CustomerName,
		t.DeviceType,
		t.DeviceBrand,
		t.Problem, // Keluhan - properly handled
		t.Price,
		t.Status,
		t.ImagePath,
	)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *TransactionRepository) Update(id int, updates map[string]interface{}) error {
	if len(updates) == 0 {
		return fmt.Errorf("no fields to update")
	}

	var setParts []string
	var args []interface{}

	for field, value := range updates {
		setParts = append(setParts, fmt.Sprintf("%s = ?", field))
		args = append(args, value)
	}

	args = append(args, id)
	query := fmt.Sprintf("UPDATE service_transactions SET %s WHERE id = ?", strings.Join(setParts, ", "))

	result, err := r.db.Exec(query, args...)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func (r *TransactionRepository) Delete(id int) error {
	query := "DELETE FROM service_transactions WHERE id = ?"
	result, err := r.db.Exec(query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func (r *TransactionRepository) ServiceExists(serviceID int) (bool, error) {
	query := "SELECT COUNT(*) FROM service WHERE id = ?"
	var count int
	err := r.db.QueryRow(query, serviceID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
