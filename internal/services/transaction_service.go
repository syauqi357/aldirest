package services

import (
	"database/sql"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"aldirest/internal/models"
	"aldirest/internal/repositories"
)

type TransactionService struct {
	repo      *repositories.TransactionRepository
	uploadDir string
}

func NewTransactionService(repo *repositories.TransactionRepository, uploadDir string) *TransactionService {
	return &TransactionService{
		repo:      repo,
		uploadDir: uploadDir,
	}
}

func (s *TransactionService) GetAll() ([]models.Transaction, error) {
	return s.repo.GetAll()
}

func (s *TransactionService) GetByID(id int) (*models.Transaction, error) {
	transaction, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if transaction == nil {
		return nil, fmt.Errorf("transaction not found")
	}
	return transaction, nil
}

func (s *TransactionService) Create(req *models.TransactionCreateRequest, imageFile *multipart.FileHeader) (int64, error) {
	// Validate required fields
	if strings.TrimSpace(req.CustomerName) == "" {
		return 0, fmt.Errorf("customer name is required")
	}
	if strings.TrimSpace(req.DeviceType) == "" {
		return 0, fmt.Errorf("device type is required")
	}
	if strings.TrimSpace(req.DeviceBrand) == "" {
		return 0, fmt.Errorf("device brand is required")
	}
	if strings.TrimSpace(req.Problem) == "" {
		return 0, fmt.Errorf("problem (keluhan) is required and cannot be empty")
	}

	// Verify service exists
	exists, err := s.repo.ServiceExists(req.ServiceID)
	if err != nil {
		return 0, err
	}
	if !exists {
		return 0, fmt.Errorf("selected service does not exist")
	}

	// Set default status if not provided
	status := strings.TrimSpace(req.Status)
	if status == "" {
		status = models.StatusPending
	}

	// Validate status
	if !models.IsValidStatus(status) {
		return 0, fmt.Errorf("invalid status value")
	}

	// Handle image upload
	var imagePath *string
	if imageFile != nil {
		uploadedPath, err := s.saveImage(imageFile)
		if err != nil {
			return 0, fmt.Errorf("failed to upload image: %w", err)
		}
		imagePath = &uploadedPath
	}

	transaction := &models.Transaction{
		ServiceID:    req.ServiceID,
		CustomerName: strings.TrimSpace(req.CustomerName),
		DeviceType:   strings.TrimSpace(req.DeviceType),
		DeviceBrand:  strings.TrimSpace(req.DeviceBrand),
		Problem:      strings.TrimSpace(req.Problem), // Keluhan - properly handled
		Price:        req.Price,
		Status:       status,
		ImagePath:    imagePath,
		Date:         time.Now(),
	}

	return s.repo.Create(transaction)
}

func (s *TransactionService) Update(id int, req *models.TransactionUpdateRequest) error {
	// Check if transaction exists
	existing, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if existing == nil {
		return fmt.Errorf("transaction not found")
	}

	updates := make(map[string]interface{})

	if req.ServiceID != nil {
		// Verify service exists
		exists, err := s.repo.ServiceExists(*req.ServiceID)
		if err != nil {
			return err
		}
		if !exists {
			return fmt.Errorf("selected service does not exist")
		}
		updates["service_id"] = *req.ServiceID
	}

	if req.CustomerName != nil {
		name := strings.TrimSpace(*req.CustomerName)
		if name == "" {
			return fmt.Errorf("customer name cannot be empty")
		}
		updates["customer_name"] = name
	}

	if req.DeviceType != nil {
		deviceType := strings.TrimSpace(*req.DeviceType)
		if deviceType == "" {
			return fmt.Errorf("device type cannot be empty")
		}
		updates["device_type"] = deviceType
	}

	if req.DeviceBrand != nil {
		deviceBrand := strings.TrimSpace(*req.DeviceBrand)
		if deviceBrand == "" {
			return fmt.Errorf("device brand cannot be empty")
		}
		updates["device_brand"] = deviceBrand
	}

	if req.Problem != nil {
		problem := strings.TrimSpace(*req.Problem)
		if problem == "" {
			return fmt.Errorf("problem (keluhan) cannot be empty")
		}
		updates["problem"] = problem
	}

	if req.Price != nil {
		updates["price"] = *req.Price
	}

	if req.Status != nil {
		status := strings.TrimSpace(*req.Status)
		if !models.IsValidStatus(status) {
			return fmt.Errorf("invalid status value")
		}
		updates["status"] = status
	}

	if len(updates) == 0 {
		return fmt.Errorf("no fields to update")
	}

	err = s.repo.Update(id, updates)
	if err == sql.ErrNoRows {
		return fmt.Errorf("transaction not found or no changes made")
	}
	return err
}

func (s *TransactionService) Delete(id int) error {
	err := s.repo.Delete(id)
	if err == sql.ErrNoRows {
		return fmt.Errorf("transaction not found")
	}
	return err
}

func (s *TransactionService) saveImage(fileHeader *multipart.FileHeader) (string, error) {
	// Validate file type
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	allowedExts := []string{".jpg", ".jpeg", ".png", ".gif"}
	isValid := false
	for _, allowed := range allowedExts {
		if ext == allowed {
			isValid = true
			break
		}
	}
	if !isValid {
		return "", fmt.Errorf("only JPG, JPEG, PNG & GIF files are allowed")
	}

	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(s.uploadDir, 0755); err != nil {
		return "", err
	}

	// Generate unique filename
	filename := fmt.Sprintf("%d-%s", time.Now().UnixNano(), filepath.Base(fileHeader.Filename))
	targetPath := filepath.Join(s.uploadDir, filename)

	// Open uploaded file
	src, err := fileHeader.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	// Create destination file
	dst, err := os.Create(targetPath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	// Copy file
	if _, err := io.Copy(dst, src); err != nil {
		return "", err
	}

	// Return URL path instead of file system path
	// This allows the frontend to fetch from http://localhost:8080/uploads/filename
	return "/uploads/" + filename, nil
}
