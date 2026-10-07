terraform {
  required_version = ">= 1.5"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

variable "subscription_id" {
  type = string
}

variable "location" {
  type    = string
  default = "japaneast"
}

variable "sku" {
  type = string
  # Azure allows only one F0 Speech resource per subscription; use "S0" if
  # one already exists or the 5 free audio hours/month run out.
  default = "F0"
}

resource "azurerm_resource_group" "speech" {
  name     = "rg-english-test-speech"
  location = var.location
}

resource "azurerm_cognitive_account" "speech" {
  name                = "english-test-speech"
  resource_group_name = azurerm_resource_group.speech.name
  location            = azurerm_resource_group.speech.location
  kind                = "SpeechServices"
  sku_name            = var.sku
}

output "azure_speech_region" {
  value = azurerm_cognitive_account.speech.location
}

output "azure_speech_key" {
  value     = azurerm_cognitive_account.speech.primary_access_key
  sensitive = true
}
