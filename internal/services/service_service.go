package services

import (
	"database/sql"
	"fmt"
	"strings"

	"aldirest/internal/models"
	"aldirest/internal/repositories"
)

type ServiceService struct {
	repo *repositories.ServiceRepository
}

func NewServiceService(repo *repositories.ServiceRepository) *ServiceService {
	return &ServiceService{repo: repo}
}

func (s *ServiceService) GetAll() ([]models.Service, error) {
	return s.repo.GetAll()
}

func (s *ServiceService) GetByID(id int) (*models.Service, error) {
	service, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if service == nil {
		return nil, fmt.Errorf("service not found")
	}
	return service, nil
}

func (s *ServiceService) Create(req *models.ServiceCreateRequest) (int64, error) {
	// Validate name
	name := strings.TrimSpace(req.Name)
	if name == "" {
		return 0, fmt.Errorf("name cannot be empty")
	}

	// Check for duplicate
	exists, err := s.repo.ExistsByName(name, 0)
	if err != nil {
		return 0, err
	}
	if exists {
		return 0, fmt.Errorf("a service with this name already exists")
	}

	service := &models.Service{
		Name:        name,
		Price:       req.Price,
		Description: strings.TrimSpace(req.Description),
	}

	return s.repo.Create(service)
}

func (s *ServiceService) Update(id int, req *models.ServiceUpdateRequest) error {
	// Check if service exists
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if existing == nil {
		return fmt.Errorf("service not found")
	}

	updates := make(map[string]interface{})

	if req.Name != nil {
		name := strings.TrimSpace(*req.Name)
		if name == "" {
			return fmt.Errorf("service name cannot be empty")
		}

		// Check for duplicate if name is being changed
		if strings.ToLower(existing.Name) != strings.ToLower(name) {
			exists, err := s.repo.ExistsByName(name, id)
			if err != nil {
				return err
			}
			if exists {
				return fmt.Errorf("a service with this name already exists")
			}
		}

		updates["name"] = name
	}

	if req.Price != nil {
		updates["price"] = *req.Price
	}

	if req.Description != nil {
		updates["description"] = strings.TrimSpace(*req.Description)
	}

	if len(updates) == 0 {
		return fmt.Errorf("no fields to update")
	}

	err = s.repo.Update(id, updates)
	if err == sql.ErrNoRows {
		return fmt.Errorf("service not found")
	}
	return err
}

func (s *ServiceService) Delete(id int) error {
	err := s.repo.Delete(id)
	if err == sql.ErrNoRows {
		return fmt.Errorf("service not found")
	}
	return err
}
