package routes

import (
	"aldirest/internal/controllers"
	"aldirest/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(
	router *gin.Engine,
	serviceController *controllers.ServiceController,
	transactionController *controllers.TransactionController,
) {
	// Apply global middleware
	router.Use(middleware.ErrorHandler())
	router.Use(middleware.Logger())
	router.Use(middleware.CORS())

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Service routes
		services := v1.Group("/services")
		{
			services.GET("", serviceController.GetServices)
			services.GET("/:id", serviceController.GetService)
			services.POST("", serviceController.CreateService)
			services.PUT("/:id", serviceController.UpdateService)
			services.DELETE("/:id", serviceController.DeleteService)
		}

		// Transaction routes
		transactions := v1.Group("/transactions")
		{
			transactions.GET("", transactionController.GetTransactions)
			transactions.GET("/:id", transactionController.GetTransaction)
			transactions.POST("", transactionController.CreateTransaction)
			transactions.PUT("/:id", transactionController.UpdateTransaction)
			transactions.DELETE("/:id", transactionController.DeleteTransaction)
		}
	}

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "Service Repair Shop API is running",
		})
	})
}
