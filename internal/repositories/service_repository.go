package repositories

import (
	"database/sql"
	"fmt"
	"strings"

	"aldirest/internal/models"
)

type ServiceRepository struct {
	db *sql.DB
}

func NewServiceRepository(db *sql.DB) *ServiceRepository {
	return &ServiceRepository{db: db}
}

func (r *ServiceRepository) GetAll() ([]models.Service, error) {
	query := "SELECT id, name, price, description FROM service ORDER BY id DESC"
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []models.Service
	for rows.Next() {
		var service models.Service
		err := rows.Scan(&service.ID, &service.Name, &service.Price, &service.Description)
		if err != nil {
			return nil, err
		}
		services = append(services, service)
	}

	return services, nil
}

func (r *ServiceRepository) GetByID(id int) (*models.Service, error) {
	query := "SELECT id, name, price, description FROM service WHERE id = ?"
	var service models.Service
	err := r.db.QueryRow(query, id).Scan(&service.ID, &service.Name, &service.Price, &service.Description)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &service, nil
}

func (r *ServiceRepository) Create(service *models.Service) (int64, error) {
	query := "INSERT INTO service (name, price, description) VALUES (?, ?, ?)"
	result, err := r.db.Exec(query, service.Name, service.Price, service.Description)
	if err != nil {
		return 0, err
	}
	return result.LastInsertId()
}

func (r *ServiceRepository) Update(id int, updates map[string]interface{}) error {
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
	query := fmt.Sprintf("UPDATE service SET %s WHERE id = ?", strings.Join(setParts, ", "))

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

func (r *ServiceRepository) Delete(id int) error {
	query := "DELETE FROM service WHERE id = ?"
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

func (r *ServiceRepository) ExistsByName(name string, excludeID int) (bool, error) {
	query := "SELECT COUNT(*) FROM service WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND id != ?"
	var count int
	err := r.db.QueryRow(query, name, excludeID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
