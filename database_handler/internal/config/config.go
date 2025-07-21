package config

import (
	"fmt"
	"os"
	"strconv"
)

const (
	EnvPrefix = "DH"
)

type Config struct {
	Port             uint
	DatabaseHost     string
	DatabaseUser     string
	DatabasePassword string
	DatabasePort     uint
	DatabaseName     string
}

func Load() *Config {
	config := &Config{
		Port:             getEnvAsUintOrDefault(fmt.Sprintf("%s_PORT", EnvPrefix), 1313),
		DatabaseHost:     getEnvOrDefault(fmt.Sprintf("%s_DB_HOST", EnvPrefix), "localhost"),
		DatabaseUser:     getEnvOrDefault(fmt.Sprintf("%s_DB_USER", EnvPrefix), "postgres"),
		DatabasePassword: getEnvOrDefault(fmt.Sprintf("%s_DB_PASS", EnvPrefix), "password"),
		DatabasePort:     getEnvAsUintOrDefault(fmt.Sprintf("%s_DB_PORT", EnvPrefix), 5432),
		DatabaseName:     getEnvOrDefault(fmt.Sprintf("%s_DB_NAME", EnvPrefix), "postgres"),
	}
	return config
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	fmt.Printf("Environment variable %s not set, using default\n", key)
	return defaultValue
}

func getEnvAsUintOrDefault(key string, defaultValue uint) uint {
	if value := os.Getenv(key); value != "" {
		if uintValue, err := strconv.Atoi(value); err == nil {
			return uint(uintValue)
		}
		fmt.Printf("failed to convert environment variable %s to int, using default\n", key)
		return defaultValue
	}
	fmt.Printf("Environment variable %s not set, using default\n", key)
	return defaultValue
}
