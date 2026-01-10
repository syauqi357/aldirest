package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"aldirest/internal/config"
	"aldirest/internal/controllers"
	"aldirest/internal/database"
	"aldirest/internal/repositories"
	"aldirest/internal/routes"
	"aldirest/internal/services"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize database
	db, err := database.New(cfg.GetDSN())
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize repositories
	serviceRepo := repositories.NewServiceRepository(db.DB)
	transactionRepo := repositories.NewTransactionRepository(db.DB)

	// Initialize services
	serviceService := services.NewServiceService(serviceRepo)
	transactionService := services.NewTransactionService(transactionRepo, cfg.Upload.Directory)

	// Initialize controllers
	serviceController := controllers.NewServiceController(serviceService)
	transactionController := controllers.NewTransactionController(transactionService)

	// Set Gin to release mode in production
	gin.SetMode(gin.ReleaseMode)

	// Create router
	router := gin.New()

	// Setup routes
	routes.SetupRoutes(router, serviceController, transactionController)

	// Serve static files (uploads directory)
	router.Static("/uploads", cfg.Upload.Directory)

	// Create HTTP server
	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", cfg.Server.Port),
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("🚀 Server starting on http://localhost:%s", cfg.Server.Port)
		log.Printf("📚 API Documentation:")
		log.Printf("   - Services: http://localhost:%s/api/v1/services", cfg.Server.Port)
		log.Printf("   - Transactions: http://localhost:%s/api/v1/transactions", cfg.Server.Port)
		log.Printf("   - Health Check: http://localhost:%s/health", cfg.Server.Port)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Graceful shutdown with 5 second timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}
