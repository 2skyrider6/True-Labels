# Simple test to check API response
param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$ImagePath = "test-images\test-1.jpg"
)

Write-Host "=== Simple API Response Test ===" -ForegroundColor Green
Write-Host "Image: $ImagePath" -ForegroundColor Yellow

if (-not (Test-Path $ImagePath)) {
    Write-Host "ERROR: Image file not found" -ForegroundColor Red
    exit 1
}

# Read image and convert to base64
$fileBytes = [System.IO.File]::ReadAllBytes($ImagePath)
$base64String = [Convert]::ToBase64String($fileBytes)

$requestBody = @{
    imageBase64 = $base64String
    imageMediaType = "image/jpeg"
} | ConvertTo-Json

Write-Host "Sending request..." -ForegroundColor Yellow
Write-Host "Request size: $($requestBody.Length) bytes" -ForegroundColor Gray

try {
    $extractResponse = Invoke-WebRequest -Uri "$BaseUrl/api/extract-ingredients" `
        -Method POST `
        -ContentType "application/json" `
        -Body $requestBody `
        -TimeoutSec 180 `
        -ErrorAction Stop
    
    Write-Host "Response Status: $($extractResponse.StatusCode)" -ForegroundColor Green
    
    $extractData = $extractResponse.Content | ConvertFrom-Json
    
    Write-Host ""
    Write-Host "=== Extraction Results ===" -ForegroundColor Cyan
    Write-Host "Ingredients count: $($extractData.ingredients.Count)" -ForegroundColor Green
    Write-Host "Confidence: $($extractData.confidence)" -ForegroundColor Green
    Write-Host "Language: $($extractData.language_detected)" -ForegroundColor Green
    
    if ($extractData.error) {
        Write-Host "Error: $($extractData.error)" -ForegroundColor Red
    }
    
    if ($extractData.ingredients.Count -gt 0) {
        Write-Host ""
        Write-Host "Ingredients:" -ForegroundColor Yellow
        $extractData.ingredients | ForEach-Object { Write-Host "  - $($_.name)" -ForegroundColor Gray }
        
        # Try analysis
        Write-Host ""
        Write-Host "Running analysis..." -ForegroundColor Yellow
        
        $analysisBody = @{
            ingredients = $extractData.ingredients
            userAllergies = @()
        } | ConvertTo-Json
        
        $analysisResponse = Invoke-WebRequest -Uri "$BaseUrl/api/analyze-ingredients" `
            -Method POST `
            -ContentType "application/json" `
            -Body $analysisBody `
            -TimeoutSec 180 `
            -ErrorAction Stop
        
        $analysisData = $analysisResponse.Content | ConvertFrom-Json
        
        Write-Host "Analysis Status: $($analysisResponse.StatusCode)" -ForegroundColor Green
        Write-Host "Risk Score: $($analysisData.product_risk_score)" -ForegroundColor Green
        Write-Host "Results: $($analysisData.results.Count) analyzed" -ForegroundColor Green
        
        if ($analysisData.top_concerns -and $analysisData.top_concerns.Count -gt 0) {
            Write-Host "Top Concerns: $($analysisData.top_concerns -join ', ')" -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}
