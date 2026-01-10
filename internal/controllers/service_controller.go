package controllers

import (
	"net/http"
	"strconv"

	"aldirest/internal/models"
	"aldirest/internal/services"

	"github.com/gin-gonic/gin"
)

type ServiceController struct {
	service *services.ServiceService
}

func NewServiceController(service *services.ServiceService) *ServiceController {
	return &ServiceController{service: service}
}

func (c *ServiceController) GetServices(ctx *gin.Context) {
	services, err := c.service.GetAll()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch services"})
		return
	}
	ctx.JSON(http.StatusOK, services)
}

func (c *ServiceController) GetService(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service ID"})
		return
	}

	service, err := c.service.GetByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, service)
}

func (c *ServiceController) CreateService(ctx *gin.Context) {
	var req models.ServiceCreateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := c.service.Create(&req)
	if err != nil {
		if err.Error() == "a service with this name already exists" {
			ctx.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message": "Service created successfully",
		"id":      id,
	})
}

func (c *ServiceController) UpdateService(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service ID"})
		return
	}

	var req models.ServiceUpdateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = c.service.Update(id, &req)
	if err != nil {
		if err.Error() == "service not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "a service with this name already exists" {
			ctx.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Service updated successfully"})
}

func (c *ServiceController) DeleteService(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid service ID"})
		return
	}

	err = c.service.Delete(id)
	if err != nil {
		if err.Error() == "service not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete service"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Service deleted successfully"})
}
