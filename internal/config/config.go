package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

type Config struct {
	Database DatabaseConfig
	Server   ServerConfig
	Upload   UploadConfig
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
}

type ServerConfig struct {
	Port string
}

type UploadConfig struct {
	Directory string
}

func Load() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	// Get the upload directory path
	uploadDir := getUploadDir()

	config := &Config{
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "3306"),
			User:     getEnv("DB_USER", "root"),
			Password: getEnv("DB_PASSWORD", ""),
			Name:     getEnv("DB_NAME", "servisaldi"),
		},
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8080"),
		},
		Upload: UploadConfig{
			Directory: uploadDir,
		},
	}

	return config, nil
}

func (c *Config) GetDSN() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		c.Database.User,
		c.Database.Password,
		c.Database.Host,
		c.Database.Port,
		c.Database.Name,
	)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getUploadDir() string {
	// Check if UPLOAD_DIR is set in environment
	if uploadDir := os.Getenv("UPLOAD_DIR"); uploadDir != "" {
		// If it's an absolute path, use it as-is
		if filepath.IsAbs(uploadDir) {
			return uploadDir
		}
		// If it's relative, make it relative to the current working directory
		absPath, err := filepath.Abs(uploadDir)
		if err == nil {
			return absPath
		}
	}

	// Default: use "uploads" directory in the project root
	// Get current working directory
	cwd, err := os.Getwd()
	if err != nil {
		return "uploads" // Fallback to relative path
	}

	// If we're in cmd/api, go up two levels to project root
	if filepath.Base(cwd) == "api" {
		cwd = filepath.Dir(filepath.Dir(cwd))
	} else if filepath.Base(cwd) == "cmd" {
		cwd = filepath.Dir(cwd)
	}

	return filepath.Join(cwd, "uploads")
}
