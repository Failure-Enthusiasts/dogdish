package config

import (
	"os"
	"reflect"
	"testing"
)

func TestLoad_AllowedOrigins(t *testing.T) {
	// Test default value
	os.Unsetenv("DH_ALLOWED_ORIGINS")
	c := Load()
	if !reflect.DeepEqual(c.AllowedOrigins, []string{"*"}) {
		t.Errorf("Expected default AllowedOrigins to be ['*'], got %v", c.AllowedOrigins)
	}

	// Test with env var
	os.Setenv("DH_ALLOWED_ORIGINS", "http://localhost:3000,http://example.com")
	defer os.Unsetenv("DH_ALLOWED_ORIGINS")

	c = Load()
	expected := []string{"http://localhost:3000", "http://example.com"}
	if !reflect.DeepEqual(c.AllowedOrigins, expected) {
		t.Errorf("Expected AllowedOrigins to be %v, got %v", expected, c.AllowedOrigins)
	}

	// Test with single value
	os.Setenv("DH_ALLOWED_ORIGINS", "https://app.dogdish.cc")
	c = Load()
	expected = []string{"https://app.dogdish.cc"}
	if !reflect.DeepEqual(c.AllowedOrigins, expected) {
		t.Errorf("Expected AllowedOrigins to be %v, got %v", expected, c.AllowedOrigins)
	}
}
